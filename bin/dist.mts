import {build} from 'vite';

import config from '../config/vite.config.mjs';

( async () => {
	try {
		await build( config );
	} catch ( err ) {
		return console.error( err );
	}
} )();

export {};
