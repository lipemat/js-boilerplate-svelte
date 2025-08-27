import {defineConfig} from 'vite';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import {getPackageConfig} from '@lipemat/js-boilerplate/helpers/package-config';
import manifestHash from '../lib/manifest-hash';
import runningFlag from '../lib/running-flag';
import fs from 'fs';
import cleanExceptRunning from '../lib/cleanup-build';
import {getGeneratedScopedName, getPostCssConfig} from '../helpers/postcss';
import svelteConfig from '../config/svelte.config';

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

export default defineConfig( {
	plugins: [
		svelte( {
			...svelteConfig,
			configFile: false,
		} ),
		cleanExceptRunning(),
		manifestHash(),
		runningFlag(),
	],
	root: getPackageConfig().workingDirectory + '/src/',
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
				'svelte-index': getPackageConfig().workingDirectory + '/src/' + 'svelte-index.ts',
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
