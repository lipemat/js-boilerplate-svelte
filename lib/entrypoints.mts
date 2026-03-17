import {type Plugin} from 'vite';
import {type InputOption} from 'rollup';
import {getPackageConfig} from '@lipemat/js-boilerplate-shared/helpers/package-config.js';

export type EntriesCallback = ( workingDirectory: string ) => InputOption;

/**
 * Vite Plugin for custome entrypoints.
 *
 * @example ```ts
 *  import {type ConfigEnv, defineConfig, type UserConfig, type UserConfigFnObject} from 'vite';
 * import {entrypoints} from '@lipemat/js-boilerplate-svelte/lib/entrypoints.mjs';
 * import config from '@lipemat/js-boilerplate-svelte/config/vite.config.mjs';
 *
 * const entries = entrypoints( ( workingDir: string ) => {
 * 	return {
 * 		'admin': workingDir + '/src/admin.ts',
 * 	};
 * } );
 *
 * const viteConfig: UserConfigFnObject = defineConfig( ( env: ConfigEnv ): UserConfig => {
 * 	const boilerplateConfig = config( env );
 * 	boilerplateConfig.plugins.push( entries );
 * 	return boilerplateConfig;
 * } );
 * ```
 */
export function entrypoints( cb: EntriesCallback ): Plugin {
	return {
		name: 'lipemat:entrypoints',
		config() {
			return {
				build: {
					rollupOptions: {
						input: cb( getPackageConfig().workingDirectory )
					}
				}
			};
		}
	};
}
