import {cssModules} from 'svelte-preprocess-cssmodules';
import postcss from 'postcss';
import {preprocess, type PreprocessorGroup, type Processed} from 'svelte/compiler';
import {getLocalIdentName, maybeGetLocalIdent} from '../helpers/postcss.mjs';
import postcssGlobalFunction from './postcss-global-function.mjs';

type CssModulesOptions = NonNullable<Parameters<typeof cssModules>[0]>;
type StylePreprocessor = NonNullable<PreprocessorGroup['style']>;

/**
 * CSS module support for local <style> tags.
 *
 * - Must go within the `preprocess` array.
 * - Does not affect imported .module.pcss files.
 * - Rewrites bare `:global` to the function form before cssModules runs.
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

			const preproccesor: PreprocessorGroup = {
				style: rewriteGlobals,
			};
			const rewritten = await preprocess( content, preproccesor, {filename} );
			const processed = await markup( {
				content: rewritten.code,
				filename,
			} );
			if ( 'object' === typeof processed ) {
				return {
					...processed,
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
 * cssModules returns no source map, so the map covers this rewrite only.
 */
async function rewriteGlobals( {
	content,
	filename,
}: Parameters<StylePreprocessor>[0] ): Promise<Processed> {
	if ( ! content.includes( ':global' ) ) {
		return {
			code: content,
		};
	}

	const result = await postcss( [ postcssGlobalFunction() ] ).process( content, {
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
