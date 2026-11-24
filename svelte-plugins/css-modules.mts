import {cssModules} from 'svelte-preprocess-cssmodules';
import postcss, {type Plugin} from 'postcss';
import {preprocess, type PreprocessorGroup, type Processed} from 'svelte/compiler';
import {getLocalIdentName, maybeGetLocalIdent} from '../helpers/postcss.mjs';
import postcssGlobalFunction from './postcss-global-function.mjs';
import postcssUnnestGlobal from './postcss-unnest-global.mjs';

type CssModulesOptions = NonNullable<Parameters<typeof cssModules>[0]>;
type StylePreprocessor = NonNullable<PreprocessorGroup['style']>;
type Contents = Parameters<StylePreprocessor>[0];

/**
 * CSS module support for local <style> tags.
 *
 * - Must go within the `preprocess` array.
 * - Does not affect imported .module.pcss files.
 * - Rewrites bare `:global` to the function form before cssModules runs.
 * - Unwraps the nested `:global(…)` cssModules leaves after it runs.
 *
 * @see postCssConfig for imported .module.pcss files.
 */
export default function cssModulesPlugin(): PreprocessorGroup {
	const {markup} = cssModules( config() );

	return {
		name: 'lipemat:css-modules',
		async markup( {content, filename} ): Promise<Processed> {
			if ( 'string' !== typeof filename || 'function' !== typeof markup ) {
				return {
					code: content,
				};
			}

			const globalProcessor: PreprocessorGroup = {
				style: ( contents: Contents ) => runPostcss( contents, postcssGlobalFunction() ),
			};
			const rewritten = await preprocess( content, globalProcessor, {filename} );

			const processed = await markup( {
				content: rewritten.code,
				filename,
			} );

			if ( 'object' === typeof processed ) {
				const unnestedProcessor: PreprocessorGroup = {
					style: ( contents: Contents ) => runPostcss( contents, postcssUnnestGlobal() ),
				};
				const unnested = await preprocess( processed.code, unnestedProcessor, {filename} );

				return {
					...processed,
					code: unnested.code,
					map: rewritten.map,
				};
			}
			return rewritten;
		},
	};
}


export function config(): CssModulesOptions {
	return {
		localIdentName: getLocalIdentName( false ),
		useAsDefaultScoping: true,
		mode: 'mixed',
		...maybeGetLocalIdent(),
	};
}


/**
 * cssModules returns no source map, so the map covers the first rewrite only.
 */
async function runPostcss( contents: Contents, plugin: Plugin ): Promise<Processed> {
	const {content, filename} = contents;
	if ( ! content.includes( ':global' ) ) {
		return {
			code: content,
		};
	}

	const result = await postcss( [ plugin ] ).process( content, {
		from: filename,
		to: filename,
		map: {
			annotation: false,
			inline: false,
		},
	} );

	return {
		code: result.css,
		map: result.map.toString(),
	};
}
