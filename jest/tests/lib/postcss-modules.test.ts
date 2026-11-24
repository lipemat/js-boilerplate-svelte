import type {SpawnSyncReturns} from 'node:child_process';
import {AtRule, Declaration, parse, Rule} from 'postcss';
import type {BuildResult, Target} from '../../helpers/build-css.mjs';
import {BUILD_TIMEOUT, runBuildCss, spawnBuildCss} from '../../helpers/run-build-css';


type BuildEnv = Exclude<Target, 'serve'>;

interface SelectorCase {
	selector: string;
	pattern: RegExp;
}

const builds = new Map<BuildEnv, BuildResult>();

/**
 * Compile the postcss-modules fixtures with the same Vite plugin chain as `dist`.
 *
 * @throws When the build fails, including the build output.
 */
function getBuild( env: BuildEnv ): BuildResult {
	const cached = builds.get( env );
	if ( undefined !== cached ) {
		return cached;
	}
	const result = runBuildCss( env );
	builds.set( env, result );
	return result;
}


function getAncestors( rule: Rule ): string[] {
	const ancestors: string[] = [];
	let parent = rule.parent;
	while ( parent instanceof AtRule || parent instanceof Rule ) {
		ancestors.unshift( parent instanceof AtRule ? `@${parent.name} ${parent.params}` : parent.selector );
		parent = parent.parent;
	}
	return ancestors;
}


/**
 * Each rule as its ancestors, selector, and declarations.
 */
function getRuleSignatures( css: string ): string[] {
	const signatures: string[] = [];
	parse( css ).walkRules( rule => {
		const declarations = rule.nodes
			.filter( ( node ): node is Declaration => node instanceof Declaration )
			.map( declaration => `${declaration.prop}:${declaration.value}${declaration.important ? '!important' : ''}` );
		signatures.push( [ ...getAncestors( rule ), rule.selector, ...declarations ].join( ' ' ) );
	} );
	return signatures;
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


	/**
	 * Modules are imported from two JS modules so a regression in
	 * deduplication or inlining would emit the same rule twice.
	 */
	it( 'includes each rule once', () => {
		const signatures = getRuleSignatures( result.css );
		expect( signatures.length ).toBeGreaterThan( 20 );
		expect( signatures.filter( ( signature, index ) => signatures.indexOf( signature ) !== index ) ).toEqual( [] );
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
		expect( result.js ).toContain( '§Ⓜcontent-module__header__' );
	} );


	it( 'resolves composes within the same file', () => {
		expect( result.js ).toMatch( /var shared = "§Ⓜshared-module__shared__[^" ]+ §Ⓜshared-module__home__[^" ]+"/ );
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


	it( 'hashes local classes around nested :global', () => {
		expect( result.css ).toContain( '.§Ⓜglobal-nested-module__form__' );
		expect( result.css ).toContain( '.§Ⓜglobal-nested-module__x__' );
		expect( result.css ).toContain( '.§Ⓜglobal-nested-module__z__' );
		expect( result.css ).toContain( '.§Ⓜglobal-nested-module__m__' );
		expect( result.css ).not.toMatch( /\.(?:form|x|z|m)[\s{:,.]/ );
	} );


	it.each<SelectorCase>( [
		{selector: 'h3.title', pattern: /\.§Ⓜglobal-nested-module__form__\S+ h3\.title \{/},
		{selector: '.b .d, .c .d', pattern: /\.§Ⓜglobal-nested-module__form__\S+ \.b \.d, \.§Ⓜglobal-nested-module__form__\S+ \.c \.d \{/},
		{selector: '.e', pattern: /\.§Ⓜglobal-nested-module__form__\S+:hover \.e \{/},
		{selector: '.top', pattern: /\n\.top \{/},
		{selector: '.y', pattern: /\.§Ⓜglobal-nested-module__x__\S+ \.y \{/},
		{selector: '.w', pattern: /\.§Ⓜglobal-nested-module__z__\S+ \.w \{/},
		{selector: '.f', pattern: /@media \(any-hover: hover\) \{\n\t\.§Ⓜglobal-nested-module__m__\S+:hover \.f \{/},
		{selector: '.g', pattern: /\n\t\.§Ⓜglobal-nested-module__m__\S+ \.g \{/},
		{selector: '.h', pattern: /\n\t\.h:hover \{/},
	] )( 'leaves nested :global $selector unhashed', ( {pattern} ) => {
		expect( result.css ).toMatch( pattern );
	} );


	it( 'exports only the local classes of nested :global files', () => {
		expect( result.js ).toContain( 'var global_nested_module_default = {\n\tform,\n\tx,\n\tz,\n\tm\n};' );
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


	it( 'hashes local classes around nested :global', () => {
		const {css} = getBuild( 'production' );
		expect( css ).toMatch( /\.[A-Za-z]{5} h3\.title\{/ );
		expect( css ).not.toMatch( /\.(?:form|x|z|m)[\s{:,.]/ );
	}, BUILD_TIMEOUT );


	it.each<SelectorCase>( [
		{selector: 'h3.title', pattern: /\.([A-Za-z]{5}) h3\.title\{/},
		{selector: '.b .d, .c .d', pattern: /\.([A-Za-z]{5}) \.b \.d,\.\1 \.c \.d\{/},
		{selector: '.e', pattern: /\.[A-Za-z]{5}:hover \.e\{/},
		{selector: '.top', pattern: /}\.top\{/},
		{selector: '.y', pattern: /\.[A-Za-z]{5} \.y\{/},
		{selector: '.w', pattern: /\.[A-Za-z]{5} \.w\{/},
		{selector: '.f', pattern: /@media \(any-hover:hover\)\{\.[A-Za-z]{5}:hover \.f\{/},
		{selector: '.g', pattern: /}\.[A-Za-z]{5} \.g\{/},
		{selector: '.h', pattern: /}\.h:hover\{/},
	] )( 'leaves nested :global $selector unhashed', ( {pattern} ) => {
		expect( getBuild( 'production' ).css ).toMatch( pattern );
	}, BUILD_TIMEOUT );


	it( 'exports only the local classes of nested :global files', () => {
		expect( getBuild( 'production' ).js ).toMatch( /=\{form:\w+,x:\w+,z:\w+,m:\w+}/ );
	}, BUILD_TIMEOUT );
} );


describe.each( [ 'development', 'production', 'serve' ] as Target[] )( 'PostCSS cross-file composes: %s', target => {
	let result: SpawnSyncReturns<string>;

	beforeAll( () => {
		result = spawnBuildCss( target, 'composed.module.pcss' );
	}, BUILD_TIMEOUT );


	it( 'fails to compile', () => {
		expect( result.status ).toBe( 1 );
	} );


	it( 'reports the composed-from file and the importing file', () => {
		expect( result.stderr ).toMatch( /Cross-file composes is not supported: "\.\/shared\.module\.pcss" in [^\n]*composed\.module\.pcss/ );
	} );
} );


describe( 'PostCSS composes: serve', () => {
	let result: SpawnSyncReturns<string>;

	beforeAll( () => {
		result = spawnBuildCss( 'serve', 'shared.module.pcss' );
	}, BUILD_TIMEOUT );


	it( 'compiles same-file and global composes', () => {
		expect( result.status ).toBe( 0 );
	} );


	it( 'resolves composes within the same file', () => {
		expect( ( JSON.parse( result.stdout ) as BuildResult ).js ).toMatch( /"§Ⓜshared-module__shared__[^" ]+ §Ⓜshared-module__home__[^" ]+"/ );
	} );


	it( 'keeps global composes unscoped', () => {
		expect( ( JSON.parse( result.stdout ) as BuildResult ).js ).toMatch( / site-title"/ );
	} );
} );
