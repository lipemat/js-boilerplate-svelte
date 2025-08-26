import {type CSSOptions, defineConfig} from 'vite';
import {getConfig} from '@lipemat/js-boilerplate/helpers/config';
import * as postcssScss from 'postcss-scss';
import {svelte} from '@sveltejs/vite-plugin-svelte';
import {resolve} from 'path';

const postcssOptions = getConfig( 'postcss.config' );

const POST_CSS_OPTIONS: CSSOptions['postcss'] = {
	plugins: postcssOptions.plugins ?? [],
	map: postcssOptions.sourceMap,
	parser: postcssScss,
	stringifier: undefined,
	syntax: undefined,
};

export default defineConfig( {
	plugins: [
		svelte( {
			configFile: 'config/svelte.config.js',
		} ),
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
