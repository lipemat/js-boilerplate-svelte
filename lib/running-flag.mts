import {writeFileSync} from 'node:fs';
import {resolve} from 'path';
import type {Plugin, ViteDevServer} from 'vite';
import {createRunningFlag} from '@lipemat/js-boilerplate-shared/helpers/running-flag.js';
import {DIST_DIR} from '../config/vite.config.mjs';


function flagContents( port: null | number, started: string ): string {
	return JSON.stringify( {
		pid: process.pid,
		port,
		started,
	} );
}


export default function runningFlag(): Plugin {
	return {
		name: 'lipemat:running-flag',
		apply: 'serve',
		configureServer( server: ViteDevServer ) {
			const flagPath = resolve( DIST_DIR, '.running' );

			const started = new Date().toISOString();

			const cleanup = createRunningFlag( flagPath, flagContents( server.config.server.port ?? null, started ) );

			// Actual port is only known once listening (strictPort may be off).
			server.httpServer?.once( 'listening', () => {
				const address = server.httpServer?.address();
				if ( null !== address && 'object' === typeof address ) {
					writeFileSync( flagPath, flagContents( address.port, started ) );
				}
			} );

			server.httpServer?.once( 'close', cleanup );
		},
	};
}
