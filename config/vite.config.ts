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

const POST_CSS_OPTIONS: CSSOptions['postcss'] = {
	plugins: postcssOptions.plugins ?? [],
	map: postcssOptions.sourceMap,
	parser: postcssScss,
	stringifier: undefined,
	syntax: undefined,
};

export const DIR = getPackageConfig().workingDirectory + '/dist-svelte';

export default defineConfig( {
	plugins: [
		svelte( {
			configFile: 'config/svelte.config.js',
		} ),
		cleanExceptRunning(),
		manifestHash(),
		runningFlag(),
	],
	root: resolve( __dirname, '../' ),
	server: {
		// Configure dev server
		host: 'localhost',
		port: 5173,
		cors: true,
	},
	base: '/dist',
	build: {
		manifest: 'manifest.json',
		rollupOptions: {
			input: {
				master: 'src/main.ts'
			},
			output: {
				entryFileNames: '[name].[hash].js',
				assetFileNames: '[name].[hash].[ext]',
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
