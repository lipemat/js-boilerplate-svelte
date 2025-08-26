import {cssModules} from 'svelte-preprocess-cssmodules';
import {type SvelteConfig, vitePreprocess} from '@sveltejs/vite-plugin-svelte';


const config: SvelteConfig = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [
		vitePreprocess(),

		// CSS module support for local <style> tags.
		cssModules( {
			localIdentName: 'production' === process.env.NODE_ENV ? '[contenthash:base52:5]' : '§Ⓜ[name]__[local]__[contenthash:base52:2]',
			useAsDefaultScoping: true,
			mode: 'mixed'
		} )
	],
	compilerOptions: {
		dev: 'production' !== process.env.NODE_ENV,
	},
};

export default config;
