#!/usr/bin/env node
'use strict';

const spawn = require( 'cross-spawn' );
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
			result = await require( 'svelte-check' );
			break;
		case 'start':
		case 'dist':
			result = spawn.sync(
				'ts-node',
				nodeArgs
					.concat( require.resolve( './' + command + '.ts' ) )
					.concat( args.slice( scriptIndex + 1 ) ),
				{stdio: 'inherit'}
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

module.exports = {};
