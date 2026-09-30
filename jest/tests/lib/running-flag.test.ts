jest.mock( '../../../config/vite.config.mjs', () => ( {
	DIST_DIR: require( 'path' ).join( require( 'os' ).tmpdir(), 'running-flag-test-' + process.pid, 'dist-svelte' ),
} ) );

import {existsSync, rmSync, unlinkSync} from 'node:fs';
import {Server} from 'node:http';
import {dirname, join} from 'node:path';
import type {MinimalPluginContextWithoutEnvironment, ViteDevServer} from 'vite';
import {DIST_DIR} from '../../../config/vite.config.mjs';
import runningFlag from '../../../lib/running-flag.mjs';

const FLAG_PATH = join( DIST_DIR, '.running' );
const SIGNALS: NodeJS.Signals[] = [ 'SIGINT', 'SIGTERM', 'SIGHUP', 'SIGBREAK' ];

let existingExitListeners: NodeJS.ExitListener[];
let existingSignalListeners: Map<NodeJS.Signals, NodeJS.SignalsListener[]>;
let mockExit: jest.SpyInstance;
let mockKill: jest.SpyInstance;


function processError( code: string ): NodeJS.ErrnoException {
	return Object.assign( new Error( code ), {code} );
}


function addedExitListeners(): NodeJS.ExitListener[] {
	return process.listeners( 'exit' ).filter( listener => ! existingExitListeners.includes( listener ) );
}


function addedSignalListeners( signal: NodeJS.Signals ): NodeJS.SignalsListener[] {
	const existing = existingSignalListeners.get( signal ) ?? [];
	return process.listeners( signal ).filter( listener => ! existing.includes( listener ) );
}


function startServer(): Server {
	const httpServer = new Server();
	const hook = runningFlag().configureServer;
	if ( 'function' === typeof hook ) {
		hook.call( {} as MinimalPluginContextWithoutEnvironment, {httpServer} as ViteDevServer );
		return httpServer;
	}
	throw new Error( 'configureServer is not a function.' );
}


beforeEach( () => {
	jest.useFakeTimers();
	rmSync( dirname( DIST_DIR ), {recursive: true, force: true} );
	existingExitListeners = process.listeners( 'exit' );
	existingSignalListeners = new Map( SIGNALS.map( signal => [ signal, process.listeners( signal ) ] ) );
	mockExit = jest.spyOn( process, 'exit' ).mockImplementation( ( () => undefined ) as () => never );
	mockKill = jest.spyOn( process, 'kill' ).mockImplementation( () => true );
} );

afterEach( () => {
	addedExitListeners().forEach( listener => process.removeListener( 'exit', listener ) );
	SIGNALS.forEach( signal => {
		addedSignalListeners( signal ).forEach( listener => process.removeListener( signal, listener ) );
	} );
	jest.restoreAllMocks();
	jest.useRealTimers();
	rmSync( dirname( DIST_DIR ), {recursive: true, force: true} );
} );


describe( 'runningFlag', () => {
	it( 'applies only to the dev server', () => {
		const plugin = runningFlag();

		expect( plugin.name ).toBe( 'lipemat:running-flag' );
		expect( plugin.apply ).toBe( 'serve' );
	} );


	it( 'creates running flag and missing dist directory on server start', () => {
		expect( existsSync( DIST_DIR ) ).toBe( false );

		startServer();

		expect( existsSync( FLAG_PATH ) ).toBe( true );
	} );


	it( 'keeps process running after server start', () => {
		startServer();

		expect( mockExit ).not.toHaveBeenCalled();
	} );


	it.each( SIGNALS.map( signal => ( {signal} ) ) )( 'exits process on $signal', ( {signal} ) => {
		startServer();

		addedSignalListeners( signal ).forEach( listener => listener( signal ) );

		expect( mockExit ).toHaveBeenCalledTimes( 1 );
	} );


	it( 'removes running flag on process exit', () => {
		startServer();
		expect( existsSync( FLAG_PATH ) ).toBe( true );

		addedExitListeners().forEach( listener => listener( 0 ) );

		expect( existsSync( FLAG_PATH ) ).toBe( false );
	} );


	it( 'removes running flag on server close', () => {
		const httpServer = startServer();
		expect( existsSync( FLAG_PATH ) ).toBe( true );

		httpServer.emit( 'close' );

		expect( existsSync( FLAG_PATH ) ).toBe( false );
	} );


	it( 'ignores already removed running flag on server close', () => {
		const httpServer = startServer();
		unlinkSync( FLAG_PATH );

		expect( () => httpServer.emit( 'close' ) ).not.toThrow();
	} );


	it( 'removes exit listener on server close', () => {
		const httpServer = startServer();
		expect( addedExitListeners() ).toHaveLength( 1 );

		httpServer.emit( 'close' );

		expect( addedExitListeners() ).toHaveLength( 0 );
	} );


	it.each( SIGNALS.map( signal => ( {signal} ) ) )( 'removes $signal listener on server close', ( {signal} ) => {
		const httpServer = startServer();
		expect( addedSignalListeners( signal ) ).toHaveLength( 1 );

		httpServer.emit( 'close' );

		expect( addedSignalListeners( signal ) ).toHaveLength( 0 );
	} );


	it( 'registers one listener per signal across server restarts', () => {
		startServer().emit( 'close' );
		startServer();

		expect( addedSignalListeners( 'SIGINT' ) ).toHaveLength( 1 );
	} );


	it( 'exits process when parent process is gone', () => {
		mockKill.mockImplementation( () => {
			throw processError( 'ESRCH' );
		} );
		startServer();

		jest.advanceTimersByTime( 3_000 );

		expect( mockExit ).toHaveBeenCalledTimes( 1 );
	} );


	it( 'waits 3 seconds before first parent check', () => {
		startServer();

		jest.advanceTimersByTime( 2_999 );
		expect( mockKill ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 1 );
		expect( mockKill ).toHaveBeenCalledTimes( 1 );
	} );


	it( 'keeps running while parent process is alive', () => {
		startServer();

		jest.advanceTimersByTime( 9_000 );

		expect( mockKill ).toHaveBeenCalledTimes( 3 );
		expect( mockExit ).not.toHaveBeenCalled();
	} );


	it( 'keeps running when parent process exists without signal permission', () => {
		mockKill.mockImplementation( () => {
			throw processError( 'EPERM' );
		} );
		startServer();

		jest.advanceTimersByTime( 3_000 );

		expect( mockKill ).toHaveBeenCalledTimes( 1 );
		expect( mockExit ).not.toHaveBeenCalled();
	} );


	it( 'probes parent process without sending a real signal', () => {
		startServer();

		jest.advanceTimersByTime( 6_000 );

		expect( mockKill.mock.calls ).toEqual( [
			[ process.ppid, 0 ],
			[ process.ppid, 0 ],
		] );
	} );


	it( 'stops watching parent process on server close', () => {
		mockKill.mockImplementation( () => {
			throw processError( 'ESRCH' );
		} );
		const httpServer = startServer();

		httpServer.emit( 'close' );
		jest.advanceTimersByTime( 9_000 );

		expect( mockKill ).not.toHaveBeenCalled();
		expect( mockExit ).not.toHaveBeenCalled();
	} );
} );
