import {type CSSOptions, defineConfig} from 'vite';
import {getConfig} from '@lipemat/js-boilerplate/helpers/config';
import * as postcssScss from 'postcss-scss';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import {resolve} from 'path';
import {getPackageConfig} from '@lipemat/js-boilerplate/helpers/package-config';
import manifestHash from '../lib/manifest-hash';
import runningFlag from '../lib/running-flag';
import fs from 'fs';
import cleanExceptRunning from '../lib/cleanup-build';

const postcssOptions = getConfig( 'postcss.config' );
const packageConfig = getPackageConfig();

const POST_CSS_OPTIONS: CSSOptions['postcss'] = {
	plugins: postcssOptions.plugins ?? [],
	map: postcssOptions.sourceMap,
	parser: postcssScss,
	stringifier: undefined,
	syntax: undefined,
};

export const DIR = packageConfig.workingDirectory + '/dist-svelte';

const url = new URL( packageConfig.url );

const ssl = 'https:' === url.protocol && 'object' === typeof ( packageConfig.certificates ) ? {
	https: {
		cert: fs.readFileSync( packageConfig.certificates.cert ),
		key: fs.readFileSync( packageConfig.certificates.key ),
	}
} : {};

export default defineConfig( {
	plugins: [
		svelte( {
			configFile: resolve( __dirname, '../' ) + '/config/svelte.config.js',
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
		...ssl
	},
	base: '/' + DIR.replace( /.*(?=(wp-content))/, '' ) + '/',
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
				dir: DIR,
				entryFileNames: '[name].js',
			}
		}
	},
	css: {
		modules: {
			generateScopedName: 'production' === process.env.NODE_ENV ? '[contenthash:base52:5]' : '§Ⓜ[name]__[local]__[contenthash:base52:2]',
			localsConvention: 'camelCase',
		},
		postcss: POST_CSS_OPTIONS,
		devSourcemap: postcssOptions.sourceMap,
	}
} );
