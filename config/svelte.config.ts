import {cssModules} from 'svelte-preprocess-cssmodules';
import {type SvelteConfig, vitePreprocess} from '@sveltejs/vite-plugin-svelte';
import {getLocalIdentName} from '../helpers/postcss';


const config: SvelteConfig = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [
		vitePreprocess(),

		// CSS module support for local <style> tags.
		cssModules( {
			localIdentName: getLocalIdentName(),
			useAsDefaultScoping: true,
			mode: 'mixed'
		} )
	],
	compilerOptions: {
		dev: 'production' !== process.env.NODE_ENV,
	},
};

export default config;
