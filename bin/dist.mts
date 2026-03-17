process.env.NODE_ENV = 'production';

import {build, type ConfigEnv, type UserConfig} from 'vite';
import {existsSync} from 'node:fs';
import {getPackageConfig} from '@lipemat/js-boilerplate-shared/helpers/package-config.js';
import {removeTrailingSlash} from '@lipemat/js-boilerplate-shared/helpers/string.js';
import {pathToFileURL} from 'node:url';

import config from '../config/vite.config.mjs';

const possibleLocalConfig: string = removeTrailingSlash( getPackageConfig().packageDirectory ) + '/vite.config.mts';

const configEnv: ConfigEnv = {
	command: 'build',
	mode: 'production',
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
		await build( viteConfig );
	} catch ( err ) {
		return console.error( err );
	}
} )();

export {};
