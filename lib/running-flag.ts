import {resolve} from 'path';
import {mkdirSync, unlinkSync, writeFileSync} from 'node:fs';
import type {Plugin, ViteDevServer} from 'vite';
import {DIST_DIR} from '../config/vite.config';

export default function runningFlag(): Plugin {
	return {
		name: 'vite:running-flag',
		apply: 'serve',
		configureServer( server: ViteDevServer ) {
			const flagPath = resolve( DIST_DIR, '.running' );


			mkdirSync( DIST_DIR, {recursive: true} );
			writeFileSync( flagPath, '' );


			const cleanup = () => {
				try {
					unlinkSync( flagPath );
				} catch {
					/* ignore if already gone */
				}
			};

			// remove on server close (in-memory shutdown)
			server.httpServer?.once( 'close', cleanup );

			// also remove on process termination / exit
			const signals: NodeJS.Signals[] = [ 'SIGINT', 'SIGTERM' ];
			for ( const sig of signals ) {
				process.once( sig, () => {
					cleanup();
					// if it's a signal rather than 'exit', re‐emit the default behavior
					if ( 'SIGINT' === sig || 'SIGTERM' === sig ) {
						process.exit();
					}
				} );
			}
		},
	};
}
