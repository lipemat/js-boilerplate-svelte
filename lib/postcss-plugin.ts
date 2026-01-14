import type {Plugin, UserConfig} from 'vite';
import {getGeneratedScopedName, getPostCssConfig} from '../helpers/postcss.mjs';

/**
 * Vite Plugin for PostCSS support.
 *
 * - Only affects imported .module.pcss files.
 * - Does not affect local <style> tags.
 *
 * @see cssModulesPlugin for local <style> tags.
 */
export default function postCssConfig(): Plugin {
	return {
		name: 'lipemat:postcss-config',

		config: (): Pick<UserConfig, 'css'> => {
			const postcssOptions = getPostCssConfig();

			return {
				css: {
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
