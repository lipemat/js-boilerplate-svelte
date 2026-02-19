process.env.NODE_ENV = 'development';

import {createServer} from 'vite';

import config from '../config/vite.config.mjs';

( async () => {
	try {
		const viteConfig = config( {
			command: 'serve',
			mode: 'development'
		} );
		const server = await createServer( viteConfig );
		await server.listen();

		server.printUrls();
		server.bindCLIShortcuts( {print: true} );
	} catch ( err ) {
		return console.error( err );
	}
} )();
