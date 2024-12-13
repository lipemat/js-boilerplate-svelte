import {sveltePreprocess} from 'svelte-preprocess';
import {cssModules} from 'svelte-preprocess-cssmodules';
import type {Configuration, ModuleOptions} from 'webpack';
import {getConfig} from '@lipemat/js-boilerplate/helpers/config';
import {getTypeScriptConfig} from '../helpers/config';
import type {AutoPreprocessOptions} from 'svelte-preprocess/dist/types/index';
import type {SvelteLoaderOptions} from './webpack.dist';

const postcssOptions = getConfig( 'postcss.config' );

/**
 * Using our standard options from `postcss.config.ts` with a few
 * explicit removals to satisfy TS configuration differences.
 */
const POST_CSS_OPTIONS: AutoPreprocessOptions['postcss'] = {
	...postcssOptions,
	map: postcssOptions.sourceMap,
	parser: require( 'postcss-scss' ),
	stringifier: undefined,
	syntax: undefined,
};

const SVELTE_LOADER_OPTIONS: SvelteLoaderOptions = {
	compilerOptions: {
		dev: true,
		cssHash: ( {hash, css, name} ) => {
			const className = hash( css );
			return `§${name}__${className}`;
		},
	},
	emitCss: true,
	hotReload: true,
	preprocess: [
		sveltePreprocess( {
			postcss: POST_CSS_OPTIONS,
			typescript: getTypeScriptConfig(),
		} ),
		// CSS module support for local <style> tags.
		cssModules( {
			localIdentName: '§Ⓜ[name]__[local]__[contenthash:base52:2]',
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
		// eval source map does not work with svelte.
		devtool: 'inline-source-map',
		resolve: {
			...config.resolve,
			// Add the extensions to be used by webpack.
			extensions: [ ...extensions, '.svelte', '.mjs' ],
			mainFields: [ 'svelte', ...config.resolve.mainFields ?? [] ],
		},
		module: {
			rules,
		},
	};
};
