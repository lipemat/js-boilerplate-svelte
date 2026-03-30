import {createRequire} from 'node:module';

const requireModule = createRequire( import.meta.url );

/**
 * Get the TypeScript config used by Svelte preprocess.
 *
 * Using the config from @tsconfig/svelte/tsconfig.json verbatim.
 *
 * @notice We must use require-json5 because the config uses comments.
 */
export function getTypeScriptConfig() {
	const requireJSON5 = requireModule( 'require-json5' );
	return requireJSON5( requireModule.resolve( '@tsconfig/svelte/tsconfig.json' ) );
}
