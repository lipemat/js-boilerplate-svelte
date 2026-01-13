import {importFresh} from '../../helpers/imports';
import type {Plugin} from 'vite';

describe( 'postcss-plugin', () => {
	afterEach( () => {
		process.env.NODE_ENV = 'development';
	} );

	it( 'Does not change unexpectedly - Dev', async () => {
		const plugin = await importFresh<() => Plugin>( './lib/postcss-plugin.js' );
		expect( plugin() ).toMatchSnapshot( 'plugin' );

		// @ts-expect-error Could be undefined.
		expect( plugin().config() ).toMatchSnapshot( 'config' );
	} );


	it( 'Does not change unexpectedly - Dist', async () => {
		process.env.NODE_ENV = 'production';
		const plugin = await importFresh<() => Plugin>( './lib/postcss-plugin.js' );
		expect( plugin() ).toMatchSnapshot( 'plugin' );

		// @ts-expect-error Could be undefined.
		expect( plugin().config() ).toMatchSnapshot( 'config' );
	} );


	it( 'Does not have the clean plugin', async () => {
		process.env.NODE_ENV = 'production';
		const plugin = await importFresh<() => Plugin>( './lib/postcss-plugin.js' );

		// @ts-expect-error Could be undefined.
		const names = plugin().config().css.postcss.plugins.map( ( plug: {
			postcssPlugin: string
		} ) => plug.postcssPlugin );
		expect( names ).not.toContain( 'clean' );
	} );
} );
