import type {Plugin, UserConfig} from 'vite';
import {getGeneratedScopedName, getPostCssConfig} from '../helpers/postcss.mjs';


export default function postCssConfig(): Plugin {
	return {
		name: 'lipemat:postcss-config',

		// Add CSS config to Vite.
		config: (): Pick<UserConfig, 'css'> => {
			const postcssOptions = getPostCssConfig();

			return {
				css: {
					// Only affects imported .pcss files.
					modules: {
						generateScopedName: getGeneratedScopedName(),
						localsConvention: 'camelCase',
					},
					postcss: postcssOptions,
					devSourcemap: postcssOptions.map,
				},
			};
		},
	};
}
