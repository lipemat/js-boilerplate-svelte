jest.mock( 'node:child_process' );

import {execSync, spawn} from 'node:child_process';
import {svelteChecker} from '../../../lib/svelte-checker.mjs';


describe( 'svelteChecker', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		jest.replaceProperty( process, 'env', {...process.env} );
		delete process.env.LIPEMAT_SVELTE_CHECK;
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );


	it( 'launches watch checker without changing parent environment', async () => {
		process.env.NODE_ENV = 'development';
		const hook = svelteChecker().configureServer;
		if ( 'function' !== typeof hook ) {
			throw new Error( 'Expected configureServer hook' );
		}

		await Reflect.apply( hook, {}, [] );

		expect( spawn ).toHaveBeenCalledWith( 'yarn', [ 'svelte-check', '--watch' ], {
			stdio: 'inherit',
			shell: true,
		} );
		expect( process.env.LIPEMAT_SVELTE_CHECK ).toBeUndefined();
	} );


	it( 'launches production checker without changing parent environment', async () => {
		process.env.NODE_ENV = 'production';
		const hook = svelteChecker().buildStart;
		if ( 'function' !== typeof hook ) {
			throw new Error( 'Expected buildStart hook' );
		}

		await Reflect.apply( hook, {}, [] );

		expect( execSync ).toHaveBeenCalledWith( 'yarn svelte-check', {
			stdio: 'inherit',
		} );
		expect( process.env.LIPEMAT_SVELTE_CHECK ).toBeUndefined();
	} );
} );
