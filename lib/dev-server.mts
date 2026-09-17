import fs from 'fs';
import {getPackageConfig} from '@lipemat/js-boilerplate-shared/helpers/package-config.js';
import {type Plugin, searchForWorkspaceRoot, type UserConfig} from 'vite';
import type {AtLeast} from '@lipemat/js-boilerplate-shared/types/utility';

export type DevServerConfig = Required<Pick<Plugin, 'name' | 'apply' | 'config'>> & {
	config: () => AtLeast<UserConfig, 'server' | 'preview'>;
}

/**
 * Detect a port passed from environments like Claude's preview
 * or fallback to default port.
 */
export function detectPort(): undefined | number {
	const envPort = Number( process.env.PORT );
	if ( ! Number.isInteger( envPort ) || 0 >= envPort ) {
		return undefined;
	}
	if ( envPort > 65535 ) {
		return undefined;
	}

	return envPort;
}

export default function devServer(): DevServerConfig {
	const port = detectPort();

	return {
		name: 'lipemat:dev-server',
		apply: 'serve',
		config() {
			const packageConfig = getPackageConfig();
			const url = new URL( packageConfig.url );

			const server: UserConfig['server'] = {
				host: url.hostname,
				port: port ?? 5173,
				strictPort: port !== undefined,
				cors: true,
				fs: {
					/**
					 * Support yarn PNP when using Sveltekit.
					 * @link https://vite.dev/config/server-options.html#server-fs-allow
					 */
					allow: [
						searchForWorkspaceRoot( process.cwd() ),
						'.yarn/__virtual__',
					],
				},
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
			return {
				server,
				preview: {
					port: port ?? 4173,
					strictPort: port !== undefined,
				},
			};
		},
	};
}
