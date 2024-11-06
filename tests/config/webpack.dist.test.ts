describe( 'webpack.dist.js', () => {
	const {getConfig} = require( '@lipemat/js-boilerplate/helpers/config' );

	const getWebpackConfig = () => {
		jest.resetModules();
		const defaultConfig = require( '@lipemat/js-boilerplate/config/webpack.dist' );
		return require( '../../config/webpack.dist' )( defaultConfig );
	};

	test( 'Snapshot', () => {
		expect( getWebpackConfig() ).toMatchSnapshot( 'production' );

		const full = getConfig( 'webpack.dist' );
		expect( full ).toMatchSnapshot( 'full' );
	} );

	test( 'Rules', () => {
		const rules = getWebpackConfig().module.rules;
		expect( rules ).toHaveLength( 5 );
		expect( rules[ 0 ].test ).toEqual( /\.(svelte|svelte\.ts)$/ );
		expect( rules[ 1 ].test ).toEqual( /node_modules\/svelte\/.*\.mjs$/ );

		const mainRule = rules[ 0 ].use;
		expect( mainRule.options.emitCss ).toEqual( true );
		expect( mainRule.options.hotReload ).not.toBeDefined();
	} );

	test( 'Extensions', () => {
		const extensions = getWebpackConfig().resolve.extensions;
		expect( extensions ).toHaveLength( 8 );
		expect( extensions ).toEqual( [ '.ts', '.tsx', '.js', '.jsx', '.json', '.pcss', '.svelte', '.mjs' ] );
	} );

	test( 'mainFields', () => {
		const mainFields = getWebpackConfig().resolve.mainFields;
		expect( mainFields ).toHaveLength( 4 );
		expect( mainFields ).toEqual( [ 'svelte', 'browser', 'module', 'main' ] );
	} );

	test( 'Devtool', () => {
		const devtool = getWebpackConfig().devtool;
		expect( devtool ).not.toBeDefined();
	} );
} );
