import cssModulesPlugin, {config} from '../../../svelte-plugins/css-modules.mjs';
import {modifyPackageConfig} from '@lipemat/js-boilerplate-shared/helpers/package-config.js';
import type {Processed} from 'svelte/compiler';
import type {BuildResult} from '../../helpers/build-css.mjs';
import {BUILD_TIMEOUT, runBuildCss} from '../../helpers/run-build-css';


/**
 * Compile a `jest/fixtures/svelte` component through real Vite.
 */
function buildComponent( fixture: string ): BuildResult {
	return runBuildCss( 'development', fixture );
}


/**
 * Replace each hashed class with `{<local name>}`.
 */
function unhash( value: string ): string {
	return value.replace( /_§[\w-]+__([\w-]+)__[A-Za-z]+/g, '{$1}' );
}


/**
 * Replace each Svelte scope class with `{scope}`.
 */
function unscope( value: string ): string {
	return value.replace( /svelte-[a-z0-9]+/g, '{scope}' );
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


describe( 'CSS Modules - Svelte Plugin markup', () => {
	const component = '<div class="a"><span class="b">B</span></div>\n<style>\n\t.a :global .b {\n\t\tcolor: red;\n\t}\n</style>\n';

	beforeEach( () => {
		process.env.NODE_ENV = 'development';
		modifyPackageConfig( {
			shortCssClasses: false,
		} );
	} );


	/**
	 * Run the plugin's markup step the way Svelte does.
	 */
	async function runMarkup( content: string, filename: string | undefined ): Promise<Processed> {
		const {markup} = cssModulesPlugin();
		if ( 'function' === typeof markup ) {
			const processed = await markup( {
				content,
				filename,
			} );
			if ( 'object' === typeof processed ) {
				return processed;
			}
		}
		throw new Error( 'The plugin has no markup step.' );
	}


	it( 'rewrites bare :global before hashing local classes', async () => {
		const {code} = await runMarkup( component, '/project/src/Component.svelte' );
		expect( code ).toMatch( /\t:global\(\._§Component__a__[A-Za-z]+\) :global\(\.b\) \{/ );
		expect( code ).toMatch( /<div class="_§Component__a__[A-Za-z]+"><span class="b">/ );
	} );


	it( 'returns a source map pointing to the component', async () => {
		const {map} = await runMarkup( component, '/project/src/Component.svelte' );
		expect( map ).toMatchObject( {
			sources: [ 'Component.svelte' ],
		} );
		expect( map ).toHaveProperty( 'mappings', expect.stringMatching( /[A-Za-z]/ ) );
	} );


	it( 'leaves component untouched without filename', async () => {
		expect( await runMarkup( component, undefined ) ).toEqual( {
			code: component,
		} );
	} );
} );


/**
 * Rewriting bare `:global` keeps classes after it unhashed in both CSS and markup.
 */
describe.each( [
	'global-nested.svelte',
	'global-nested-pcss.svelte',
] )( 'CSS Modules - Svelte Plugin bare :global in %s', fixture => {
	let result: BuildResult;
	let css: string;

	beforeAll( () => {
		result = buildComponent( fixture );
		css = unhash( result.css );
	}, BUILD_TIMEOUT );


	it.each( [
		'.{form} h3.title {',
		'.{form} .b .d, .{form} .c .d {',
		'.{form}:hover .e {',
		'\n.top {',
		'.{x} .y {',
		'.{z} .w {',
		'\t.{m}:hover .f {',
		'\t.{m} .g {',
		'\t.h:hover {',
		'\n.list-global, .{list-local} {',
		'.{outer} .inner .{leaf} {',
		'\n.{local-fn}:not(div) {',
		'.{outer-fn} .inner-fn .{leaf-fn} .tail-fn {',
		'.{mid} .mid-g.{mid-l} {',
		'\n.{mid-c}.mid-x {',
		'\n.{mid-c}.mid-x.{local-v} {',
	] )( 'emits `%s`', selector => {
		expect( css ).toContain( selector );
	} );


	it( 'emits no literal :global or :local', () => {
		expect( css ).toContain( '.top' );
		expect( css ).not.toContain( ':global' );
		expect( css ).not.toContain( ':local' );
	} );


	it( 'hashes local markup classes and leaves global ones raw', () => {
		const classes: string[] = result.js.match( /class="[^"]*"/g ) ?? [];
		expect( classes.map( unhash ) ).toEqual( [
			'class="{form}"',
			'class="title"',
			'class="b"',
			'class="d"',
			'class="c"',
			'class="d"',
			'class="e"',
			'class="top"',
			'class="{x}"',
			'class="y"',
			'class="{z}"',
			'class="w"',
			'class="{m}"',
			'class="f"',
			'class="g"',
			'class="h"',
			'class="list-global"',
			'class="{list-local}"',
			'class="{outer}"',
			'class="inner"',
			'class="{leaf}"',
			'class="{local-fn}"',
			'class="{outer-fn}"',
			'class="inner-fn"',
			'class="{leaf-fn}"',
			'class="tail-fn"',
			'class="{mid}"',
			'class="mid-g {mid-l}"',
			'class="{mid-c} mid-x"',
		] );
	} );


	it( 'compiles without warnings', () => {
		expect( result.warnings ).toEqual( [] );
	} );
} );


/**
 * `:global` inside pseudo arguments is stripped in a class compound and wrapped elsewhere.
 */
describe.each( [
	'global-pseudo.svelte',
	'global-pseudo-pcss.svelte',
] )( 'CSS Modules - Svelte Plugin :global in pseudo arguments in %s', fixture => {
	let result: BuildResult;
	let css: string;

	beforeAll( () => {
		result = buildComponent( fixture );
		css = unscope( unhash( result.css ) );
	}, BUILD_TIMEOUT );


	it.each( [
		'\n.{strip-not}:not(.g-not) {',
		'\n.{strip-not-fn}:not(.g-not-fn) {',
		'\n.{strip-nested}:not(:is(.g-nested)) {',
		'\n.{strip-has}:has(.g-has) {',
		'\n.{strip-is}:is(.g-is, .g-is-fn) {',
		'\n.{strip-amp}:where(.g-amp) {',
		'\np.{scope}:not(.g-tag-not) {',
		'\n.{wrap-is} :is(.g-wrap-is, .local-is.{scope}) {',
		'\n:is(.g-lead) .{wrap-lead} {',
		'\n.{wrap-where} :where(.g-where) {',
		'\n.{wrap-local} :is(.g-local .local-leaf.{scope}) {',
		'\nsection.{scope}:not(:is(.g-section-not)) {',
		'\n.{wrap-fn} :is(.g-wrap-fn, .local-fn.{scope}) {',
		'\ndiv.{scope}:has(.g-div-has) {',
		'\n.{wrap-fn-strip} .g-fn-host:not(.g-fn-not) {',
	] )( 'emits `%s`', selector => {
		expect( `\n${css}` ).toContain( selector );
	} );


	it( 'emits no literal :global', () => {
		expect( css ).toContain( '.g-not' );
		expect( css ).not.toContain( ':global' );
	} );


	/**
	 * Svelte scopes every element, global ones included, because `p:not(…)` and `:is(…)` may match any of them.
	 */
	it( 'hashes local markup classes and leaves global ones raw', () => {
		const classes: string[] = result.js.match( /class="[^"]*"/g ) ?? [];
		expect( classes.map( value => unscope( unhash( value ) ) ) ).toEqual( [
			'class="{strip-not} {scope}"',
			'class="g-not {scope}"',
			'class="{strip-not-fn} {scope}"',
			'class="g-not-fn {scope}"',
			'class="{strip-nested} {scope}"',
			'class="g-nested {scope}"',
			'class="{strip-has} {scope}"',
			'class="g-has {scope}"',
			'class="{strip-is} g-is {scope}"',
			'class="{strip-amp} {scope}"',
			'class="g-amp {scope}"',
			'class="g-tag {scope}"',
			'class="{wrap-is} {scope}"',
			'class="g-wrap-is {scope}"',
			'class="local-is {scope}"',
			'class="g-lead {scope}"',
			'class="{wrap-lead} {scope}"',
			'class="{wrap-where} {scope}"',
			'class="g-where {scope}"',
			'class="{wrap-local} {scope}"',
			'class="g-local {scope}"',
			'class="local-leaf {scope}"',
			'class="g-section {scope}"',
			'class="{wrap-fn} {scope}"',
			'class="g-wrap-fn {scope}"',
			'class="local-fn {scope}"',
			'class="{scope}"',
			'class="g-div-has {scope}"',
			'class="{wrap-fn-strip} {scope}"',
			'class="g-fn-host {scope}"',
		] );
	} );


	it( 'compiles without warnings', () => {
		expect( result.warnings ).toEqual( [] );
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
