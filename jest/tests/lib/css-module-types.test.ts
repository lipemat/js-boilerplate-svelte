import * as fs from 'fs';
import {basename, join, resolve} from 'path';
import cssModuleTypes from '../../../lib/css-module-types';
import {sync} from 'glob';


jest.mock( 'fs', () => {
	return {
		...jest.requireActual( 'fs' ),
		writeFileSync: jest.fn(),
	};
} );


async function triggerWatcher( file: string ) {
	const watcher = {
		on: jest.fn(),
	};
	// @ts-ignore
	cssModuleTypes()?.configureServer( {
		watcher,
	} );
	await watcher.on.mock.calls[ 0 ][ 1 ]( file );
}


describe( 'Format CSS Module Typings', () => {
	beforeEach( () => {
		jest.resetAllMocks();
	} );


	test( 'Empty files are not generated', async () => {
		const pcssFile = join( 'jest/fixtures/postcss-modules/default.pcss' );
		await triggerWatcher( pcssFile );

		expect( fs.writeFileSync ).not.toHaveBeenCalled();

		// @ts-ignore
		cssModuleTypes().config().css.modules.getJSON( pcssFile, {} );
		expect( fs.writeFileSync ).not.toHaveBeenCalled();
	} );


	test.each( sync( 'jest/fixtures/postcss-modules/source/*.pcss' ).map( pcssFile => {
		const filename = basename( pcssFile );
		const cleanFile = join( 'jest/fixtures/postcss-modules/results', filename.replace( /\.pcss$/, '.pcss.d.ts' ) );

		return {
			description: `Formats CSS types for ${filename}`,
			pcssFile,
			cleanFile,
		};
	} ) )( '$description', async ( {pcssFile, cleanFile} ) => {
		const expectedContent = fs.readFileSync( cleanFile, 'utf8' );
		await triggerWatcher( resolve( pcssFile ) );

		expect( fs.writeFileSync ).toHaveBeenCalledWith( resolve( pcssFile.replace( /\.pcss$/, '.pcss.d.ts' ) ), expectedContent );
	} );


	test( 'getJSON callback on build', async () => {
		const pcssFile = join( 'jest/fixtures/postcss-modules/source/share.pcss' );
		// @ts-ignore
		cssModuleTypes().config().css.modules.getJSON( resolve( pcssFile ), {
			yesterday: 'blue',
			today: 'red',
			tomorrow: 'green',
		} );
		expect( fs.writeFileSync ).toHaveBeenCalledWith( resolve( pcssFile.replace( /\.pcss$/, '.pcss.d.ts' ) ), fs.readFileSync( join( 'jest/fixtures/postcss-modules/results/json-callback.d.ts' ), 'utf8' ) );
	} );
} );
