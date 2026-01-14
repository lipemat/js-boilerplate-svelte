import {importFresh} from '../../helpers/imports';
import type {Plugin} from 'vite';
import {getPostCssConfig} from '../../../helpers/postcss.mjs';
import * as PostCSS from 'postcss';

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


	it( 'Has the clean plugin - default', async () => {
		process.env.NODE_ENV = 'production';
		const plugin = getPostCssConfig();
		const names = plugin.plugins?.map( ( plug: PostCSS.AcceptedPlugin ) => {
			if ( 'postcssPlugin' in plug ) {
				return plug.postcssPlugin;
			}
			return 'unknown';
		} );
		expect( names ).toContain( 'clean' );
	} );
} );
