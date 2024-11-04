const sveltePreprocess = require( 'svelte-preprocess' ).sveltePreprocess;
const {cssModules} = require( 'svelte-preprocess-cssmodules' );
const interpolateName = require( 'loader-utils/lib/interpolateName' );

const {getConfig} = require( '@lipemat/js-boilerplate/helpers/config' );
const {getLocalIdent, usingShortCssClasses} = require( '@lipemat/js-boilerplate/helpers/css-classnames' );
const {getTypeScriptConfig} = require( '../helpers/config' );

const postcssOptions = getConfig( 'postcss.config.js' );
postcssOptions.parser = require( 'postcss-scss' );


module.exports = function( config ) {
	if ( ! config.resolve.mainFields ) {
		// Webpack Defaults.
		config.resolve.mainFields = [ 'browser', 'module', 'main' ];
	}

	const rules = [ ...config.module.rules ];

	// Required to prevent errors from Svelte on Webpack 5.
	rules.unshift( {
		test: /node_modules\/svelte\/.*\.mjs$/,
		resolve: {
			fullySpecified: false,
		},
	} );

	// Main svelte rule.
	rules.unshift( {
		test: /\.(html|svelte)$/,
		use: {
			loader: 'svelte-loader',
			options: {
				compilerOptions: {
					dev: false,
					/**
					 * Strip the `svelte-` prefix from CSS class names.
					 * Hash the CSS with base52 to prevent leading numbers or dashes.
					 */
					cssHash: ( {filename, name, css} ) => {
						if ( usingShortCssClasses() ) {
							return getLocalIdent( {
								resourcePath: filename,
							}, '', name );
						}

						// Mimic `localIdentName` from `css-loader`.
						return interpolateName( {
							resourcePath: filename,
						},
						'[contenthash:base52:5]',
						{
							content: css,
							context: process.cwd(),
						} );
					},
				},
				emitCss: true,
				preprocess: [
					sveltePreprocess( {
						postcss: postcssOptions,
						typescript: getTypeScriptConfig(),
					} ),
					// CSS module support for local <style> tags.
					cssModules( {
						...usingShortCssClasses() ? {getLocalIdent} : {},
						localIdentName: '[contenthash:base52:5]',
						useAsDefaultScoping: true,
						mode: 'mixed',
					} ),
				],
			},
		},
	} );


	return {
		resolve: {
			...config.resolve,
			// Add the extensions to be used by webpack.
			extensions: [ ...config.resolve.extensions, '.svelte', '.mjs' ],
			mainFields: [ 'svelte', ...config.resolve.mainFields ],
		},
		module: {
			rules,
		},
	};
};
