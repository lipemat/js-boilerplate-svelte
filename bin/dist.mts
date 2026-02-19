import {build} from 'vite';

import config from '../config/vite.config.mjs';

( async () => {
	try {
		const viteConfig = config( {
			command: 'build',
			mode: 'production'
		} );
		await build( viteConfig );
	} catch ( err ) {
		return console.error( err );
	}
} )();

export {};
