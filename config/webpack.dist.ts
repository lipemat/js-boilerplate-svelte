import {sveltePreprocess} from 'svelte-preprocess';
import {cssModules} from 'svelte-preprocess-cssmodules';
import interpolateName from 'loader-utils/lib/interpolateName';
import type {Configuration, ModuleOptions} from 'webpack';
import {getConfig} from '@lipemat/js-boilerplate/helpers/config';
import {getLocalIdent, usingShortCssClasses} from '@lipemat/js-boilerplate/helpers/css-classnames';
import {getTypeScriptConfig} from '../helpers/config';
import type {CompileOptions, PreprocessorGroup} from 'svelte/compiler';
import type {AutoPreprocessGroup, AutoPreprocessOptions} from 'svelte-preprocess/dist/types/index';

const postcssOptions = getConfig( 'postcss.config' );

/**
 * Partial options for the 'svelte-loader'.
 *
 * @link https://www.npmjs.com/package/svelte-loader
 */
export type SvelteLoaderOptions = {
	compilerOptions: CompileOptions;
	emitCss?: boolean;
	preprocess: Array<AutoPreprocessGroup | PreprocessorGroup>;
	hotReload?: boolean;
	hotOptions?: Partial<{
		preserveLocalState: false,
		noPreserveStateKey: '@!hmr',
		noReload: false,
		optimistic: false,
		acceptAccessors: true,
		acceptNamedExports: true,
	}>;
}

/**
 * Using our standard options from `postcss.config.ts` with a few
 * explit removals to satifiy TS configuration differences.
 */
const POST_CSS_OPTIONS: AutoPreprocessOptions['postcss'] = {
	...postcssOptions,
	map: postcssOptions.sourceMap,
	parser: require( 'postcss-scss' ),
	stringifier: undefined,
	syntax: undefined,
};

/**
 * Options for the 'svelte-loader'.
 */
const SVELTE_LOADER_OPTIONS: SvelteLoaderOptions = {
	compilerOptions: {
		dev: false,
		/**
		 * Strip the `svelte-` prefix from CSS class names.
		 * Hash the CSS with base52 to prevent leading numbers or dashes.
		 */
		cssHash: ( {filename, name, css} ) => {
			if ( usingShortCssClasses() ) {
				return getLocalIdent( {resourcePath: filename ?? ''}, '', name );
			}

			// Mimic `localIdentName` from `css-loader`.
			return interpolateName( {resourcePath: filename}, '[contenthash:base52:5]', {
				content: css,
				context: process.cwd(),
			} );
		},
	},
	emitCss: true,
	preprocess: [
		sveltePreprocess( {
			postcss: POST_CSS_OPTIONS,
			typescript: getTypeScriptConfig(),
		} ),
		// CSS module support for local <style> tags.
		cssModules( {
			...usingShortCssClasses() ? {
				getLocalIdent: ( context, localIdentName, localName ) => getLocalIdent( context, localIdentName.interpolatedName, localName ),
			} : {},
			localIdentName: '[contenthash:base52:5]',
			useAsDefaultScoping: true,
			mode: 'mixed',
		} ),
	],
};


module.exports = function( config: Configuration ) {
	if ( 'undefined' === typeof config.resolve ) {
		config.resolve = {};
	}
	if ( 'undefined' === typeof config.resolve.mainFields ) {
		// Webpack Defaults.
		config.resolve.mainFields = [ 'browser', 'module', 'main' ];
	}

	let rules: ModuleOptions['rules'] = [];
	if ( 'undefined' !== typeof config.module?.rules ) {
		rules = [ ...config.module.rules ];
	}

	// Required to prevent errors from Svelte on Webpack 5.
	rules.unshift( {
		test: /node_modules\/svelte\/.*\.mjs$/,
		resolve: {
			fullySpecified: false,
		},
	} );

	// Main svelte rule.
	rules.unshift( {
		test: /\.(svelte|svelte\.ts)$/,
		use: {
			loader: 'svelte-loader',
			options: SVELTE_LOADER_OPTIONS,
		},
	} );

	const extensions = 'undefined' !== typeof config.resolve.extensions ? config.resolve.extensions : [];

	return {
		resolve: {
			...config.resolve,
			// Add the extensions to be used by webpack.
			extensions: [ ...extensions, '.svelte', '.mjs' ],
			mainFields: [ 'svelte', ...config.resolve.mainFields ],
		},
		module: {
			rules,
		},
	};
};
