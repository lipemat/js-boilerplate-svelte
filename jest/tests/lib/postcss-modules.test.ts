import {execFileSync} from 'node:child_process';
import {join} from 'node:path';


type BuildEnv = 'development' | 'production';

interface BuildResult {
	css: string;
	js: string;
}

const builds = new Map<BuildEnv, BuildResult>();
const BUILD_TIMEOUT = 120000;

/**
 * Compile the postcss-modules fixtures with the same Vite plugin
 * chain as `dist` in a child process, which uses the real `vite`
 * module (`vite` is mapped to a mock within Jest).
 *
 * @throws When the build fails, including the build output.
 */
function getBuild( env: BuildEnv ): BuildResult {
	const cached = builds.get( env );
	if ( undefined !== cached ) {
		return cached;
	}
	const output = execFileSync( process.execPath, [ join( 'jest', 'helpers', 'build-css.mts' ), env ], {
		encoding: 'utf8',
	} );
	const result = JSON.parse( output ) as BuildResult;
	builds.set( env, result );
	return result;
}

describe.each( [ 'development', 'production' ] as BuildEnv[] )( 'PostCSS Resulting CSS: %s', env => {
	let result: BuildResult;

	beforeAll( () => {
		result = getBuild( env );
	}, BUILD_TIMEOUT );


	it( 'preserves global class names', () => {
		expect( result.css ).toMatch( /\.not-module\s*\{/ );
		expect( result.css ).toMatch( /\.share\s*\{/ );
		expect( result.css ).toMatch( /\.share a\s*\{/ );
		expect( result.css ).toMatch( /\.global-class-name\s*\{/ );
		expect( result.css ).toMatch( /\.parent-class-name \.child-class-name\s*\{/ );
	} );
} );


describe( 'PostCSS Modules compiled CSS: development', () => {
	let result: BuildResult;

	beforeAll( () => {
		result = getBuild( 'development' );
	}, BUILD_TIMEOUT );

	it( 'resolves custom media queries from the global data files', () => {
		expect( result.css ).toContain( '@media (max-width: 800px)' );
		expect( result.css ).toContain( '@media (max-width: 960px)' );
	} );


	it( 'flattens nested rules', () => {
		expect( result.css ).toMatch( /\.§Ⓜcontent-module__header__[^ ]+ a \{/ );
		expect( result.css ).toContain( 'padding: 4px' );
	} );


	it( 'preserves declaration values', () => {
		expect( result.css ).toContain( 'background: #32cd32' );
		expect( result.css ).toContain( 'border: 4px solid #000' );
		expect( result.css ).toContain( 'background: var(--c-yellow)' );
		expect( result.css ).toContain( 'color: rgb(0, 128, 0)' );
	} );


	it( 'scopes classnames with the Ⓜ pattern', () => {
		expect( result.css ).toContain( '.§Ⓜshared-module__shared__' );
		expect( result.js ).toContain( '§Ⓜcomposed-module__imported__' );
	} );


	it( 'resolves composes within the same file', () => {
		expect( result.js ).toMatch( /var shared = "§Ⓜshared-module__shared__[^" ]+ §Ⓜshared-module__home__[^" ]+"/ );
	} );


	it( 'resolves composes from another module file', () => {
		expect( result.js ).toMatch( /var imported = "§Ⓜcomposed-module__imported__[^" ]+ §Ⓜshared-module__shared__[^" ]+ §Ⓜshared-module__home__[^" ]+"/ );
	} );


	it( 'resolves chained composes across files', () => {
		expect( result.js ).toMatch( /var chained = "§Ⓜcomposed-module__chained__[^" ]+ §Ⓜcomposed-module__imported__[^" ]+ §Ⓜshared-module__shared__[^" ]+ §Ⓜshared-module__home__[^" ]+ §Ⓜshared-module__heading__[^" ]+"/ );
	} );


	it( 'keeps global composes unscoped', () => {
		expect( result.js ).toContain( ' site-title"' );
		expect( result.css ).not.toMatch( /§Ⓜ[^ "{]*site-title/ );
	} );


	it( 'leaves no unprocessed nested syntax behind', () => {
		expect( result.css ).not.toMatch( /;[^{};]*\{/ );
		expect( result.css ).not.toContain( '( --mobile )' );
	} );


	it( 'pretty prints the output', () => {
		expect( result.css ).toContain( '{\n\t' );
		expect( result.css.split( '\n' ).length ).toBeGreaterThan( 10 );
	} );

	/**
	 * Targeting the `--tablet` media query as only the "mulitple-media-queries.module.pcss" file uses it.
	 *
	 * Media queries are combined by file, not application.
	 */
	it( 'combines same media queries into one block', () => {
		const mediaCount = ( result.css.match( /@media\s*\(\s*max-width:\s*1200px\s*\)\s*and\s*\(\s*min-width:\s*800px\s*\)\s*\{/g ) ?? [] ).length;
		expect( mediaCount ).toBe( 1 );

		const hoverCount = ( result.css.match( /@media\s*\(\s*hover:\s*hover\s*\)\s*\{/g ) ?? [] ).length;
		expect( hoverCount ).toBe( 1 );
	} );

	it( 'only includes media adjustments once', () => {
		const mediaCount = ( result.css.match( /@media\s*\(\s*max-width:\s*960px\s*\)\s*\{\s*:root\s*\{\s*--content-width:\s*800px;?\s*}\s*}/g ) ?? [] ).length;

		expect( mediaCount ).toBe( 1 );
	} );
} );


describe( 'PostCSS Modules compiled CSS: production', () => {
	it( 'compiles without errors', () => {
		expect( () => getBuild( 'production' ) ).not.toThrow();
	}, BUILD_TIMEOUT );


	it( 'minifies the CSS', () => {
		const {css} = getBuild( 'production' );
		expect( css.trim() ).not.toContain( '\n' );
		expect( css.length ).toBeLessThan( getBuild( 'development' ).css.length );
	}, BUILD_TIMEOUT );


	it( 'resolves custom media queries from the global data files', () => {
		expect( getBuild( 'production' ).css ).toMatch( /@media\s*\(\s*(?:max-width:\s*800px|width\s*<=\s*800px)\s*\)/ );
	}, BUILD_TIMEOUT );


	it( 'leaves no unprocessed nested syntax behind', () => {
		const {css} = getBuild( 'production' );
		expect( css ).not.toMatch( /;[^{};]*\{/ );
		expect( css ).not.toContain( '( --mobile )' );
	}, BUILD_TIMEOUT );


	it( 'resolves chained composes across files', () => {
		expect( getBuild( 'production' ).js ).toMatch( /["'`]([A-Za-z]{5} ){4}[A-Za-z]{5}["'`]/ );
	}, BUILD_TIMEOUT );


	// Guards the `moduleSideEffects: 'no-treeshake'` transform in lib/postcss-plugin.ts.
	it( 'keeps CSS of bare-imported module files which export no classes', () => {
		const {css} = getBuild( 'production' );
		expect( css ).toMatch( /body\s*\{[^}]*direction:\s*ltr/ );
		expect( css ).toMatch( /\.not-module\s*\{/ );
	}, BUILD_TIMEOUT );


	it( 'keeps global composes unscoped', () => {
		const {css, js} = getBuild( 'production' );
		expect( js ).toContain( 'site-title' );
		expect( css ).not.toContain( 'site-title' );
	}, BUILD_TIMEOUT );

	/**
	 * Targeting the `--tablet` media query as only the "mulitple-media-queries.module.pcss" file uses it.
	 *
	 * Media queries are combined by file, not application.
	 */
	it( 'combines same media queries into one block', () => {
		const {css} = getBuild( 'production' );
		const mediaCount = ( css.match( /@media\s*\(width<=1200px\)\s*and\s*\(width>=800px\)\s*\{/g ) ?? [] ).length;
		expect( mediaCount ).toBe( 1 );

		const hoverCount = ( css.match( /@media\s*\(\s*hover:\s*hover\s*\)\s*\{/g ) ?? [] ).length;
		expect( hoverCount ).toBe( 1 );
	} );


	it( 'only includes media adjustments once', () => {
		const {css} = getBuild( 'production' );
		const mediaCount = ( css.match( /@media\s*\(width<=960px\)\s*\{\s*:root\s*\{\s*--content-width:\s*800px;?\s*}\s*}/g ) ?? [] ).length;

		expect( mediaCount ).toBe( 1 );
	} );
} );
