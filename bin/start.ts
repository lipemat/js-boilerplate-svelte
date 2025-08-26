process.env.NODE_ENV = 'development';

import {createServer} from 'vite';

import config from '../config/vite.config';

( async () => {
	try {
		const server = await createServer( config );
		await server.listen();

		server.printUrls();
		server.bindCLIShortcuts( {print: true} );
	} catch ( err ) {
		return console.error( err );
	}
} )();
