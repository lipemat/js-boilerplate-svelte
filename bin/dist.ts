process.env.NODE_ENV = 'production';

import {build} from 'vite';

import config from '../config/vite.config';

( async () => {
	try {
		await build( config );
	} catch ( err ) {
		return console.error( err );
	}
} )();
