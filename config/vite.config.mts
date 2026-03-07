import {type ConfigEnv, defineConfig, type UserConfig, type UserConfigFnObject} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import {getPackageConfig} from '@lipemat/js-boilerplate-shared/helpers/package-config.js';
import manifestHash from '../lib/manifest-hash.mjs';
import runningFlag from '../lib/running-flag.mjs';
import cleanExceptRunning from '../lib/cleanup-build.mjs';
import svelteConfig from './svelte.config.mjs';
import wpExternals from '../lib/wp-externals.mjs';
import {svelteChecker} from '../lib/svelte-checker.mjs';
import cssModuleTypes from '../lib/css-module-types.mjs';
import postCssConfig from '../lib/postcss-plugin.js';
import devServer from '../lib/dev-server.mjs';
import brotliCompress from '../lib/brotli-compress.mjs';

const packageConfig = getPackageConfig();

export const DIST_DIR = packageConfig.workingDirectory + '/dist-svelte';

const plugins: UserConfig['plugins'] = [
	svelte( {
		...svelteConfig,
		configFile: false,
	} ),
	svelteChecker(),
	wpExternals(),
	cssModuleTypes(),
	postCssConfig(),
];


/**
 * Finished configuration for Vite.
 */
const viteConfig: UserConfigFnObject = defineConfig( ( env: ConfigEnv ): UserConfig => {

	/**
	 * Environment specific plugins
	 */
	if ( 'build' === env.command ) {
		plugins.push( manifestHash() );
		plugins.push( cleanExceptRunning() );
		plugins.push( brotliCompress() );
	} else {
		plugins.push( runningFlag() );
		plugins.push( devServer() );
	}


	return {
		plugins,
		resolve: {
			alias: {
				$src: packageConfig.workingDirectory + '/src/',
			},
		},
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
		}
	};
} );

export default viteConfig;
