import type {Plugin} from 'vite';
import {type ChildProcess, execSync, spawn} from 'node:child_process';

const PLUGIN_NAME: string = 'lipemat:svelte-checker';


function createChecker(): ChildProcess | Buffer<ArrayBufferLike> {
	const args: string[] = [
		'svelte-check',
	];

	if ( 'production' !== process.env.NODE_ENV ) {
		args.push( '--watch' );
		return spawn( 'yarn', args, {stdio: 'inherit', shell: true} );
	}

	return execSync( 'yarn ' + args.join( ' ' ), {stdio: 'inherit'} );
}


export function svelteChecker(): Plugin {
	return {
		name: PLUGIN_NAME,

		async configureServer() {
			createChecker();
		},

		async buildStart() {
			if ( 'production' === process.env.NODE_ENV ) {
				try {
					createChecker();
					// eslint-disable-next-line @typescript-eslint/no-unused-vars
				} catch ( error ) {
					process.exit( 1 );
				}
			}
		},
	};
}
