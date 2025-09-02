import {defineConfig, type UserConfig} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import {getPackageConfig} from '@lipemat/js-boilerplate/helpers/package-config';
import manifestHash from '../lib/manifest-hash';
import runningFlag from '../lib/running-flag';
import fs from 'fs';
import cleanExceptRunning from '../lib/cleanup-build';
import {getGeneratedScopedName, getPostCssConfig} from '../helpers/postcss';
import svelteConfig from '../config/svelte.config';
import wpExternals from '../lib/wp-externals';
import {compression} from 'vite-plugin-compression2';
import {svelteChecker} from '../lib/svelte-checker';
import cssModuleTypes from '../lib/css-module-types';

const postcssOptions = getPostCssConfig();
const packageConfig = getPackageConfig();

export const DIST_DIR = packageConfig.workingDirectory + '/dist-svelte';

const url = new URL( packageConfig.url );

const plugins: UserConfig['plugins'] = [
	svelte( {
		...svelteConfig,
		configFile: false,
	} ),
	svelteChecker(),
	wpExternals(),
	cssModuleTypes(),
];
if ( 'production' === process.env.NODE_ENV ) {
	plugins.push( manifestHash() );
	plugins.push( cleanExceptRunning() );
	plugins.push( compression( {
		algorithms: [ 'brotliCompress' ],
	} ) );
} else {
	plugins.push( runningFlag() );
}


/**
 * Finished configuration for Vite.
 */
const viteConfig: UserConfig = defineConfig( {
	plugins,
	root: packageConfig.workingDirectory + '/src/',
	base: '/' + DIST_DIR.replace( /.*?((wp-)?content)/, '$1' ) + '/',
	build: {
		emptyOutDir: false,
		manifest: 'manifest.json',
		rollupOptions: {
			input: {
				'svelte-index': packageConfig.workingDirectory + '/src/' + 'svelte-index.ts',
			},
			output: {
				assetFileNames: '[name].[hash].[ext]',
				chunkFileNames: '[name].[hash].js',
				dir: DIST_DIR,
				entryFileNames: '[name].[hash].js',
				format: 'module',
			},
		},
	},
	css: {
		// Only affects imported .pcss files.
		modules: {
			generateScopedName: getGeneratedScopedName(),
			localsConvention: 'camelCase',
		},
		postcss: postcssOptions,
		devSourcemap: postcssOptions.map,
	},
} );

/**
 * Dev server configuration.
 */
if ( 'production' !== process.env.NODE_ENV ) {
	const ssl: UserConfig['server'] = 'https:' === url.protocol && 'object' === typeof ( packageConfig.certificates ) ? {
		https: {
			cert: fs.readFileSync( packageConfig.certificates.cert ),
			key: fs.readFileSync( packageConfig.certificates.key ),
		},
	} : {};

	viteConfig.server = {
		host: url.hostname,
		port: 5173,
		cors: true,
		...ssl,
	};
}

export default viteConfig;
