process.env.NODE_ENV = 'development';

import {removeTrailingSlash} from '@lipemat/js-boilerplate-shared/helpers/string.js';
import {type ConfigEnv, createServer, type UserConfig} from 'vite';
import {getPackageConfig} from '@lipemat/js-boilerplate-shared/helpers/package-config.js';
import {existsSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

import config from '../config/vite.config.mjs';

const possibleLocalConfig: string = removeTrailingSlash( getPackageConfig().packageDirectory ) + '/vite.config.mts';

const configEnv: ConfigEnv = {
	command: 'serve',
	mode: 'development',
	isPreview: false,
	isSsrBuild: false,
};

( async () => {
	try {
		let viteConfig: UserConfig;
		if ( existsSync( possibleLocalConfig ) ) {
			const localConfig = await import( pathToFileURL( possibleLocalConfig ).href );
			viteConfig = localConfig.default( configEnv );
		} else {
			viteConfig = config( configEnv );
		}
		const server = await createServer( viteConfig );
		await server.listen();

		server.printUrls();
		server.bindCLIShortcuts( {print: true} );
	} catch ( err ) {
		return console.error( err );
	}
} )();
