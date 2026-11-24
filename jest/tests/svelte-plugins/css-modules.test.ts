import cssModulesPlugin, {config} from '../../../svelte-plugins/css-modules.mjs';
import {modifyPackageConfig} from '@lipemat/js-boilerplate-shared/helpers/package-config.js';
import type {BuildResult} from '../../helpers/build-css.mjs';
import {BUILD_TIMEOUT, runBuildCss} from '../../helpers/run-build-css';


/**
 * Compile a `jest/fixtures/svelte` component through real Vite.
 */
function buildComponent( fixture: string ): BuildResult {
	return runBuildCss( 'development', fixture );
}


describe( 'CSS Modules - Svelte Plugin', () => {
	it( 'Should not change unexpectedly', () => {
		expect( cssModulesPlugin() ).toMatchSnapshot( 'plugin' );

		expect( config() ).toMatchSnapshot( 'config' );
	} );


	it( 'Should not include Ⓜ for postcss modules', () => {
		expect( config().localIdentName ).not.toContain( 'Ⓜ' );

		expect( config().localIdentName ).toBe( '§[name]__[local]__[contenthash:base52:2]' );
	} );


	it( 'Should use short hash on production', () => {
		process.env.NODE_ENV = 'production';
		expect( config().localIdentName ).toBe( '[contenthash:base52:5]' );
	} );


	it( 'Should have local ident on production', () => {
		process.env.NODE_ENV = 'production';
		modifyPackageConfig( {
			shortCssClasses: true,
		} );
		expect( config() ).toHaveProperty( 'getLocalIdent' );
		expect( config().getLocalIdent ).toBeInstanceOf( Function );
	} );


	it( 'Should not have local ident on development', () => {
		process.env.NODE_ENV = 'development';
		modifyPackageConfig( {
			shortCssClasses: true,
		} );
		expect( config() ).not.toHaveProperty( 'getLocalIdent' );
	} );


	it( 'Show not have local ident with shortCssClasses disabled', () => {
		process.env.NODE_ENV = 'production';
		modifyPackageConfig( {
			shortCssClasses: false,
		} );
		expect( config() ).not.toHaveProperty( 'getLocalIdent' );
	} );
} );


/**
 * Characterizes `svelte-preprocess-cssmodules` hashing markup classes by name across the whole component.
 */
describe( 'CSS Modules - Svelte Plugin limitations', () => {
	/**
	 * `svelte-preprocess-cssmodules` `template.mjs:7` hashes markup `c` but not `:not(.c)`; a failure means upstream behavior changed.
	 */
	it( 'leaves :not(.c) raw while markup .c is hashed', () => {
		const {css, js} = buildComponent( 'not-local-c.svelte' );
		expect( js ).toMatch( /class="_§not-local-c__a__[A-Za-z]+ _§not-local-c__c__[A-Za-z]+"/ );
		expect( css ).toMatch( /\._§not-local-c__a__[A-Za-z]+:not\(\.c\) \{/ );
	}, BUILD_TIMEOUT );


	/**
	 * `svelte-preprocess-cssmodules` `template.mjs:7` hashes markup `b` but not `:not(.b)`; a failure means upstream behavior changed.
	 */
	it( 'leaves :not(.b) raw while markup .b is hashed', () => {
		const {css, js} = buildComponent( 'not-local-b.svelte' );
		expect( js ).toMatch( /class="_§not-local-b__a__[A-Za-z]+ _§not-local-b__b__[A-Za-z]+"/ );
		expect( css ).toMatch( /\._§not-local-b__a__[A-Za-z]+:not\(\.b\) \{/ );
	}, BUILD_TIMEOUT );


	/**
	 * `svelte-preprocess-cssmodules` `template.mjs:7` hashes markup `c`, so Svelte prunes `.c` from `:is()`; a failure means upstream behavior changed.
	 */
	it( 'prunes .c from :is(.b, .c) with an unused selector warning', () => {
		const {css, warnings} = buildComponent( 'is-local-c.svelte' );
		expect( css ).toMatch( /\._§is-local-c__a__[A-Za-z]+ :is\(\.b\.svelte-[a-z0-9]+ \/\* \(unused\) \.c\*\/\) \{/ );
		expect( warnings ).toEqual( [
			'css_unused_selector: Unused CSS selector ".c"\nhttps://svelte.dev/e/css_unused_selector',
		] );
	}, BUILD_TIMEOUT );


	/**
	 * `svelte-preprocess-cssmodules` `template.mjs:7` hashes markup `b` while `:global(.b)` stays raw; a failure means upstream behavior changed.
	 */
	it( 'leaves :global(.b) raw while markup .b is hashed', () => {
		const {css, js} = buildComponent( 'global-local-b.svelte' );
		expect( js ).toMatch( /<div class="_§global-local-b__b__[A-Za-z]+">/ );
		expect( css ).toMatch( /\n\.b \._§global-local-b__a__[A-Za-z]+ \{/ );
	}, BUILD_TIMEOUT );
} );
