const mockCheck = jest.fn();
const mockSpawn = jest.fn( () => ( {status: 0} ) );

jest.mock( 'svelte-check', () => {
	mockCheck( process.env.LIPEMAT_SVELTE_CHECK, [ ...process.argv ] );
	return {};
} );
jest.mock( 'cross-spawn', () => ( {sync: mockSpawn} ) );


describe( 'lipemat-js-boilerplate-svelte', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.replaceProperty( process, 'env', {...process.env} );
		delete process.env.LIPEMAT_SVELTE_CHECK;
		jest.replaceProperty( process, 'argv', [ 'node', 'cli' ] );
		jest.spyOn( process, 'exit' ).mockImplementation(
			jest.fn<ReturnType<typeof process.exit>, Parameters<typeof process.exit>>(),
		);
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );


	it.each( [ {args: []}, {args: [ '--watch' ]} ] )( 'marks checker before loading with arguments $args', async ( {args} ) => {
		process.argv.push( 'check-types', ...args );

		await jest.isolateModulesAsync( async () => {
			require( '../../../bin/lipemat-js-boilerplate-svelte.js' );
			await Promise.resolve();
		} );

		expect( mockCheck ).toHaveBeenCalledWith(
			'true',
			[ 'node', 'cli', 'check-types', ...args, '--fail-on-warnings' ],
		);
		expect( mockSpawn ).not.toHaveBeenCalled();
		expect( mockCheck ).toHaveBeenCalled();
		expect( process.env.LIPEMAT_SVELTE_CHECK ).not.toBeUndefined();
	} );


	it.each( [ 'start', 'dist' ] )( 'leaves %s processes unmarked', async command => {
		process.argv.push( command );

		await jest.isolateModulesAsync( async () => {
			require( '../../../bin/lipemat-js-boilerplate-svelte.js' );
			await Promise.resolve();
		} );

		expect( mockSpawn ).toHaveBeenCalledTimes( 2 );
		expect( mockCheck ).not.toHaveBeenCalled();
		expect( process.env.LIPEMAT_SVELTE_CHECK ).toBeUndefined();
	} );
} );
