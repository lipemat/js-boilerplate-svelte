import {build} from 'vite';

import config from '../config/vite.config.mts';

( async () => {
	try {
		await build( config );
	} catch ( err ) {
		return console.error( err );
	}
} )();

export {};
