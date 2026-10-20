import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import type {Root} from 'postcss';
import postcss from 'postcss';
import postcssModules from 'postcss-modules';
import {createPostcssModulesLoader} from '../../../helpers/postcss-modules-loader.mjs';

describe( 'postcss-modules-loader finalSource', () => {
	/**
	 * postcss-modules fetches composed-from files in parallel
	 * (Promise.all), so `traces` fill in completion order.
	 * The combined source must still list dependencies before their
	 * dependents or the CSS cascade order changes between builds.
	 */
	it( 'orders dependencies before dependents when fetches finish out of order', () => {
		const Loader = createPostcssModulesLoader( [] );
		const loader = new Loader( '/', [] );

		// Race outcome: the shallow sibling completed before the deep chain.
		loader.traces[ '\x00\x01' ] = '/project/shallow.module.pcss';
		loader.traces[ '\x00\x00\x00' ] = '/project/deep.module.pcss';
		loader.traces[ '\x00\x00' ] = '/project/middle.module.pcss';
		loader.sources[ '/project/shallow.module.pcss' ] = '.shallow { color: red }';
		loader.sources[ '/project/deep.module.pcss' ] = '.deep { color: blue }';
		loader.sources[ '/project/middle.module.pcss' ] = '.middle { color: green }';

		const combined = loader.finalSource as Root;
		const files = combined.nodes.map( node => node.source?.input.file );
		expect( files ).toEqual( [
			'/project/deep.module.pcss',
			'/project/middle.module.pcss',
			'/project/shallow.module.pcss',
		] );
	} );


	describe( 'postcss-modules-loader with the real postcss-modules plugin', () => {
		/**
		 * Real fetch race: main composes from `middle` and `shallow` in
		 * parallel (Promise.all) while `middle` composes from `deep`.
		 * `shallow` finishes first since it has no dependencies, so
		 * without trace sorting the prepended sources come out as
		 * shallow, deep, middle instead of dependencies-first.
		 */
		it( 'prepends composed-from sources dependencies-first', async () => {
			const entry = resolve( 'jest/fixtures/postcss-modules/sorting/main.module.pcss' );
			const result = await postcss( [
				postcssModules( {
					getJSON: () => undefined,
					// The d.ts predates finalSource returning a Root.
					Loader: createPostcssModulesLoader( [] ) as never,
				} ),
			] ).process( readFileSync( entry, 'utf8' ), {from: entry} );

			const css = result.css;
			expect( css.indexOf( 'ordering-deep' ) ).toBeLessThan( css.indexOf( 'ordering-middle' ) );
			expect( css.indexOf( 'ordering-middle' ) ).toBeLessThan( css.indexOf( 'ordering-shallow' ) );
			expect( css.indexOf( 'ordering-shallow' ) ).toBeLessThan( css.indexOf( 'ordering-main' ) );
		} );
	} );
} );
