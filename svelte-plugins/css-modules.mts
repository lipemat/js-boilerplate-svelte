import {cssModules} from 'svelte-preprocess-cssmodules';
import {getLocalIdentName, maybeGetLocalIdent} from '../helpers/postcss.mjs';
import type {PreprocessorGroup} from 'svelte/compiler';

type CssModulesOptions = NonNullable<Parameters<typeof cssModules>[0]>;

/**
 * CSS module support for local <style> tags.
 *
 * - Must go within the `preprocess` array.
 * - Does not affect imported .module.pcss files.
 *
 * @see postCssConfig for imported .module.pcss files.
 */
export default function cssModulesPlugin(): PreprocessorGroup {
	return cssModules( config() );
}


export function config(): CssModulesOptions {
	return {
		localIdentName: getLocalIdentName( false ),
		useAsDefaultScoping: true,
		mode: 'mixed',
		...maybeGetLocalIdent(),
	};
}
