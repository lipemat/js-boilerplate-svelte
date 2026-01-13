#!/usr/bin/env node
'use strict';

import {sync as spawn} from 'cross-spawn';
import {createRequire} from 'node:module';

const requireModule = createRequire( import.meta.url );

const args = process.argv.slice( 2 );

const scriptIndex = args.findIndex(
	x => 'start' === x || 'dist' === x || 'check-types' === x
);
const command = -1 === scriptIndex ? args[ 0 ] : args[ scriptIndex ];
const nodeArgs = scriptIndex > 0 ? args.slice( 0, scriptIndex ) : [];


( async () => {
	let result;
	switch ( command ) {
		case 'check-types':
			result = await import( 'svelte-check' );
			break;
		case 'start':
		case 'dist':
			// If the ts-node command is not available, install it globally.
			if ( spawn( 'ts-node', [ '-v' ] ).error ) {
				console.log( 'Installing ts-node globally.' );
				spawn( 'npm', [ 'install', '-g', 'ts-node' ] );
			}

			result = spawn(
				'ts-node',
				nodeArgs
					.concat( requireModule.resolve( './' + command + '.mts' ) )
					.concat( args.slice( scriptIndex + 1 ) ),
				{
					stdio: 'inherit',
					env: {
						...process.env,
						NODE_ENV: command === 'start' ? 'development' : 'production',
					}
				}
			);
			if ( result.error ) {
				console.error( result.error );
				process.exit( 1 );
			}
			if ( result.signal ) {
				if ( 'SIGKILL' === result.signal ) {
					console.error(
						'The build failed because the process exited too early. ' +
						'This probably means the system ran out of memory or someone called ' +
						'`kill -9` on the process.',
					);
				} else if ( 'SIGTERM' === result.signal ) {
					console.error(
						'The build failed because the process exited too early. ' +
						'Someone might have called `kill` or `killall`, or the system could ' +
						'be shutting down.',
					);
				}
				process.exit( 1 );
			}
			process.exit( result.status );
			break;

		default:
			console.error( `Unknown command: ${command}` );
			console.error( 'Perhaps you need to update lipemat-js-boilerplate-svelte?' );
			process.exit( 1 );
	}

	if ( result.error ) {
		console.error( result.error );
		process.exit( 1 );
	}
} )();

export {};
