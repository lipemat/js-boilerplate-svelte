const sveltePreprocess = require( 'svelte-preprocess' );
const {cssModules} = require( 'svelte-preprocess-cssmodules' );

const {getConfig} = require( '@lipemat/js-boilerplate/helpers/config' );
const {getTypeScriptConfig} = require( '../helpers/config' );

const postcssOptions = {...getConfig( 'postcss.config.js' )};
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
						postcss: postcssOptions,
						typescript: getTypeScriptConfig(),
					} ),
					// CSS module support for local <style> tags.
					cssModules( {
						localIdentName: '§Ⓜ[name]__[local]__[contenthash:base52:2]',
						useAsDefaultScoping: true,
						mode: 'mixed',
					} ),
				],
			},
		},
	} );


	return {
		// eval source map does not work with svelte.
		devtool: 'inline-source-map',
		resolve: {
			...config.resolve,
			// Add the extensions to be used by webpack.
			extensions: [ ...config.resolve.extensions, '.svelte', '.mjs' ],
			mainFields: [ 'svelte', ...config.resolve.mainFields ?? [] ],
		},
		module: {
			rules,
		},
	};
};
