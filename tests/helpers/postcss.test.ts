import {getLocalIdentName, getPostCssConfig} from '../../helpers/postcss';

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
		const originalEnv = process.env.NODE_ENV;

		process.env.NODE_ENV = 'production';
		const prodName = getLocalIdentName();
		expect( prodName ).toBe( '[contenthash:base52:5]' );

		process.env.NODE_ENV = 'development';
		const devName = getLocalIdentName();
		expect( devName ).toBe( '§Ⓜ[name]__[local]__[contenthash:base52:2]' );

		process.env.NODE_ENV = originalEnv;
	} );
} );
