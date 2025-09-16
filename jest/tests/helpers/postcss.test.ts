import {getGeneratedScopedName, getLocalIdentName, getPostCssConfig, maybeGetLocalIdent} from '../../../helpers/postcss';
import {usingShortCssClasses} from '@lipemat/js-boilerplate/helpers/css-classnames';
import type {GetLocalIdent} from 'svelte-preprocess-cssmodules/dist/lib';

// Change this variable during tests.
// noinspection ES6ConvertVarToLetConst
var mockShortCssEnabled = false;

jest.mock( '@lipemat/js-boilerplate/helpers/package-config.js', () => ( {
	...jest.requireActual( '@lipemat/js-boilerplate/helpers/package-config.js' ),
	getPackageConfig: () => ( {
		...jest.requireActual( '@lipemat/js-boilerplate/helpers/package-config.js' ),
		// Change this variable during the test.
		shortCssClasses: mockShortCssEnabled,
	} ),
} ) );

beforeEach( () => {
	mockShortCssEnabled = false;
	process.env.NODE_ENV = 'development';
} );


describe( 'getPostCssConfig', () => {
	it( 'should return a valid PostCSS configuration object', () => {
		const result = getPostCssConfig();
		expect( result ).toMatchSnapshot();
	} );


	it( 'should return a configuration that includes plugins.', () => {
		const result = getPostCssConfig();
		expect( Array.isArray( result.plugins ) ).toBe( true );
		expect( result.plugins ).toHaveLength( 8 );
	} );
} );

describe( 'getLocalIdentName', () => {
	it( 'should return a different string based on the NODE_ENV', () => {
		process.env.NODE_ENV = 'production';
		const prodName = getLocalIdentName();
		expect( prodName ).toBe( '[contenthash:base52:5]' );

		process.env.NODE_ENV = 'development';
		const devName = getLocalIdentName();
		expect( devName ).toBe( '§Ⓜ[name]__[local]__[contenthash:base52:2]' );
	} );


	test( 'Are Short CSS Classes Enabled?', () => {
		expect( usingShortCssClasses() ).toEqual( false );
		mockShortCssEnabled = true;
		expect( usingShortCssClasses() ).toEqual( true );
	} );
} );


describe( 'getGeneratedScopedName', () => {
	it( 'should return a short CSS classname when enabled', () => {
		process.env.NODE_ENV = 'production';
		mockShortCssEnabled = true;
		const shortName = getGeneratedScopedName();
		expect( typeof shortName ).toBe( 'function' );
		if ( 'function' === typeof shortName ) {
			expect( shortName( 'somefile.scss', 'myClass', '' ) ).toMatch( /^§/ );
			expect( shortName( 'somefile.scss', 'myClass', '' ) ).toBe( '§A' );
		}
	} );
} );


describe( 'mabyeGetLocalIdent', () => {
	type LocalIdentParams = Parameters<GetLocalIdent>;

	function makeResource( path: string ): LocalIdentParams[0] {
		return {resourcePath: path} as LocalIdentParams[0];
	}

	function makeIdent( name: string ): LocalIdentParams[1] {
		return {interpolatedName: name} as LocalIdentParams[1];
	}


	it( 'should return an object with getLocalIdent when short CSS classes are enabled', () => {
		mockShortCssEnabled = true;
		process.env.NODE_ENV = 'production';
		const result = maybeGetLocalIdent();
		expect( typeof result ).toBe( 'object' );
		expect( typeof result.getLocalIdent ).toBe( 'function' );
	} );


	it( 'should return an empty object when short CSS classes are not enabled', () => {
		process.env.NODE_ENV = 'development';
		mockShortCssEnabled = true;
		const result = maybeGetLocalIdent();
		expect( typeof result ).toBe( 'object' );
		expect( Object.keys( result ) ).toHaveLength( 0 );

		process.env.NODE_ENV = 'production';
		mockShortCssEnabled = false;
		const result2 = maybeGetLocalIdent();
		expect( typeof result2 ).toBe( 'object' );
		expect( Object.keys( result2 ) ).toHaveLength( 0 );
	} );


	it( 'should return a short CSS classname when enabled', () => {
		process.env.NODE_ENV = 'production';
		mockShortCssEnabled = true;
		const result = maybeGetLocalIdent();
		expect( typeof result ).toBe( 'object' );
		expect( typeof result.getLocalIdent ).toBe( 'function' );


		if ( 'function' === typeof result.getLocalIdent ) {
			expect( result.getLocalIdent( makeResource( 'somefile.scss' ), makeIdent( '' ), 'myClass', {} as LocalIdentParams[3] ) ).toMatch( /^§/ );
			expect( result.getLocalIdent( makeResource( 'somefile.scss' ), makeIdent( '' ), 'myClass', {} as LocalIdentParams[3] ) ).toBe( '§A' );
		}
	} );
} );
