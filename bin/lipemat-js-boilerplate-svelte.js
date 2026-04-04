#!/usr/bin/env node
'use strict';

const args = process.argv.slice( 2 );

const scriptIndex = args.findIndex( x => 'check-types' === x );
let command = -1 === scriptIndex ? args[ 0 ] : args[ scriptIndex ];


( async () => {
	let result;
	switch ( command ) {
		case 'check-types':
			process.argv.push( '--fail-on-warnings' );
			result = await import( 'svelte-check' );
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
