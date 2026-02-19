import fs from 'fs';
import {getPackageConfig} from '@lipemat/js-boilerplate-shared/helpers/package-config.js';
import {type Plugin, searchForWorkspaceRoot, type UserConfig} from 'vite';

type DevServerConfig = Required<Pick<Plugin, 'name' | 'apply' | 'config'>> & {
	config: () => UserConfig['server'];
}


export default function devServer(): DevServerConfig {
	return {
		name: 'lipemat:dev-server',
		apply: 'serve',
		config() {
			const packageConfig = getPackageConfig();
			const url = new URL( packageConfig.url );

			const server: UserConfig['server'] = {
				host: url.hostname,
				port: 5173,
				cors: true,
				fs: {
					/**
					 * Support yarn PNP when using Sveltekit.
					 * @link https://vite.dev/config/server-options.html#server-fs-allow
					 */
					allow: [
						searchForWorkspaceRoot( process.cwd() ),
						'.yarn/__virtual__'
					],
				}
			};

			if ( 'https:' === url.protocol &&
				'object' === typeof packageConfig.certificates &&
				'cert' in packageConfig.certificates &&
				'key' in packageConfig.certificates
			) {
				server.https = {
					cert: fs.readFileSync( packageConfig.certificates.cert ),
					key: fs.readFileSync( packageConfig.certificates.key ),
				};
			}
			return {server};
		},
	};
}
