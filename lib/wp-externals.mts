import type {Plugin, UserConfig} from 'vite';
import PluginExternals from 'vite-plugin-external';
import PluginExternalGlobals from 'rollup-plugin-external-globals';
import wpExports from '@lipemat/js-boilerplate-shared/helpers/wp-externals.js';


export default function wpExternals(): Plugin[] {
	const plugin: Plugin = {
		name: 'lipemat:wp-externals',
		apply: 'build',
		config(): UserConfig {
			return {
				optimizeDeps: {
					exclude: Object.keys( wpExports ),
				},
				build: {
					rollupOptions: {
						external: Object.keys( wpExports ),
						output: {
							globals: wpExports,
						},
					},
				},
			};
		},
	};

	return [
		plugin,
		PluginExternalGlobals( wpExports ),
		PluginExternals( {
			development: {
				externals: wpExports,
			},
		} ),
	];
}
