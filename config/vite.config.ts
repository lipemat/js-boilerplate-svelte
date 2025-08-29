import {defineConfig, type UserConfig} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import {getPackageConfig} from '@lipemat/js-boilerplate/helpers/package-config';
import manifestHash from '../lib/manifest-hash';
import runningFlag from '../lib/running-flag';
import fs from 'fs';
import cleanExceptRunning from '../lib/cleanup-build';
import {getGeneratedScopedName, getPostCssConfig} from '../helpers/postcss';
import svelteConfig from '../config/svelte.config';
import checker from 'vite-plugin-checker';
import wpExternals from '../lib/wp-externals';

const postcssOptions = getPostCssConfig();
const packageConfig = getPackageConfig();

export const DIST_DIR = packageConfig.workingDirectory + '/dist-svelte';

const url = new URL( packageConfig.url );

const ssl = 'https:' === url.protocol && 'object' === typeof ( packageConfig.certificates ) ? {
	https: {
		cert: fs.readFileSync( packageConfig.certificates.cert ),
		key: fs.readFileSync( packageConfig.certificates.key ),
	},
} : {};


const plugins: UserConfig['plugins'] = [
	svelte( {
		...svelteConfig,
		configFile: false,
	} ),
	checker( {
		typescript: {
			root: packageConfig.packageDirectory,
		},
		eslint: {
			lintCommand: `eslint "${packageConfig.workingDirectory}/src/**/*.svelte"`,
			useFlatConfig: true,
			watchPath: packageConfig.workingDirectory + '/src/',
		},
	} ),
	wpExternals(),
];
if ( 'production' === process.env.NODE_ENV ) {
	plugins.push( manifestHash() );
	plugins.push( cleanExceptRunning() );
} else {
	plugins.push( runningFlag() );
}


/**
 * Finished configuration for Vite.
 */
const viteConfig: UserConfig = defineConfig( {
	plugins,
	root: packageConfig.workingDirectory + '/src/',
	server: {
		host: url.hostname,
		port: 5173,
		cors: true,
		...ssl,
	},
	base: '/' + DIST_DIR.replace( /.*(?=(wp-content))/, '' ) + '/',
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
				entryFileNames: '[name].js',
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

export default viteConfig;
