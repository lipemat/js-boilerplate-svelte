import {execFileSync, spawnSync, type SpawnSyncReturns} from 'node:child_process';
import {join} from 'node:path';
import type {BuildResult, Target} from './build-css.mjs';

export const BUILD_TIMEOUT = 120000;


/**
 * Run `build-css.mts` in a child process, which uses the real `vite`
 * module (`vite` is mapped to a mock within Jest).
 *
 * @throws When the build fails, including the build output.
 */
export function runBuildCss( target: Target, module: string = '' ): BuildResult {
	const output = execFileSync( process.execPath, getArgs( target, module ), {
		encoding: 'utf8',
	} );
	return JSON.parse( output ) as BuildResult;
}


/**
 * Run `build-css.mts` in a child process without throwing when it fails.
 */
export function spawnBuildCss( target: Target, module: string ): SpawnSyncReturns<string> {
	return spawnSync( process.execPath, getArgs( target, module ), {
		encoding: 'utf8',
	} );
}


function getArgs( target: Target, module: string ): string[] {
	const args: string[] = [ join( 'jest', 'helpers', 'build-css.mts' ), target ];
	if ( '' !== module ) {
		args.push( module );
	}
	return args;
}
