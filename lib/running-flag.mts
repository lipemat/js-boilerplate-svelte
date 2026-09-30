import {resolve} from 'path';
import {mkdirSync, unlinkSync, writeFileSync} from 'node:fs';
import type {Plugin, ViteDevServer} from 'vite';
import {DIST_DIR} from '../config/vite.config.mjs';

const PARENT_CHECK_INTERVAL = 3_000;

/**
 * SIGHUP fires when the terminal is closed (POSIX and Windows).
 * SIGBREAK fires on Ctrl+Break (Windows).
 */
const EXIT_SIGNALS: NodeJS.Signals[] = [ 'SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK' ];


function isProcessAlive( pid: number ): boolean {
	try {
		process.kill( pid, 0 );
		return true;
	} catch ( error ) {
		return 'EPERM' === ( error as NodeJS.ErrnoException ).code;
	}
}


function exit(): void {
	process.exit();
}


function cleanup( flagPath: string ): () => void {
	// Parent may be killed without forwarding a signal (e.g. terminal force-closed).
	const parentPid = process.ppid;
	const parentWatcher = setInterval( () => {
		if ( ! isProcessAlive( parentPid ) ) {
			exit();
		}
	}, PARENT_CHECK_INTERVAL );
	parentWatcher.unref();

	return function exitHandler() {
		clearInterval( parentWatcher );
		process.off( 'exit', exitHandler );
		for ( const signal of EXIT_SIGNALS ) {
			process.off( signal, exit );
		}
		try {
			unlinkSync( flagPath );
		} catch {
			/* ignore if already gone */
		}
	};
}


export default function runningFlag(): Plugin {
	return {
		name: 'lipemat:running-flag',
		apply: 'serve',
		configureServer( server: ViteDevServer ) {
			const flagPath = resolve( DIST_DIR, '.running' );

			mkdirSync( DIST_DIR, {recursive: true} );
			writeFileSync( flagPath, '' );

			const exitHandler = cleanup( flagPath );
			server.httpServer?.once( 'close', exitHandler );
			process.once( 'exit', exitHandler );
			for ( const signal of EXIT_SIGNALS ) {
				process.once( signal, exit );
			}
		},
	};
}
