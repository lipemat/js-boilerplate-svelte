import {type SvelteConfig, vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import cssModulesPlugin from '../svelte-plugins/css-modules.mjs';

const config: SvelteConfig = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [
		vitePreprocess(),
		cssModulesPlugin(),
	],
	compilerOptions: {
		dev: 'production' !== process.env.NODE_ENV,
	},
};

export default config;
