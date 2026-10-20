import type {CSSModulesOptions, Plugin, UserConfig} from 'vite';
import type {LoaderConstructor} from '../helpers/postcss-modules-loader.mjs';
import {createPostcssModulesLoader} from '../helpers/postcss-modules-loader.mjs';
import {getGeneratedScopedName, getPostCssConfig} from '../helpers/postcss.mjs';

type ModulesOptions = CSSModulesOptions & {
	Loader: LoaderConstructor;
};

type TransformResult = undefined | {
	code: string;
	moduleSideEffects: 'no-treeshake';
};

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
		enforce: 'post',

		config: (): Pick<UserConfig, 'css'> => {
			const postcssOptions = getPostCssConfig();
			const modules: ModulesOptions = {
				generateScopedName: getGeneratedScopedName(),
				globalModulePaths: [
					/[/\\]pcss[/\\].*/,
				],
				Loader: createPostcssModulesLoader( postcssOptions.plugins ?? [] ),
				localsConvention: 'camelCase',
			};

			return {
				css: {
					modules,
					postcss: postcssOptions,
					devSourcemap: postcssOptions.map,
				},
			};
		},

		/**
		 * Keep CSS of `.module.pcss` files which only export global or
		 * no classes. Vite marks CSS modules as side-effect free, so a
		 * bare import gets tree-shaken along with its styles.
		 */
		transform: ( code: string, id: string ): TransformResult => {
			if ( /\.module\.pcss($|\?)/.test( id ) ) {
				return {code, moduleSideEffects: 'no-treeshake'};
			}
		},
	};
}
