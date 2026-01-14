import {cssModules} from 'svelte-preprocess-cssmodules';
import {getLocalIdentName, maybeGetLocalIdent} from '../helpers/postcss.mjs';
import type {PreprocessorGroup} from 'svelte/compiler';
import type {PluginOptions} from 'svelte-preprocess-cssmodules/dist/types/index';

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


export function config(): Partial<PluginOptions> {
	return {
		localIdentName: getLocalIdentName( false ),
		useAsDefaultScoping: true,
		mode: 'mixed',
		...maybeGetLocalIdent(),
	};
}
