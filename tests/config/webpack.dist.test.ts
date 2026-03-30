import defaultConfig from '@lipemat/js-boilerplate/config/webpack.dist.js';
import webpackConfig from '../../config/webpack.dist.js';
import {getConfig} from '@lipemat/js-boilerplate/helpers/config.js';
import {type Configuration, RuleSetRule} from 'webpack';

describe( 'webpack.dist.js', () => {
	const getWebpackConfig = (): Configuration => {
		jest.resetModules();
		return webpackConfig( defaultConfig );
	};

	test( 'Snapshot', async () => {
		expect( getWebpackConfig() ).toMatchSnapshot( 'production' );

		const full = await getConfig( 'webpack.dist.js' );
		expect( full ).toMatchSnapshot( 'full' );
	} );


	test( 'Rules', () => {
		const rules: RuleSetRule[] = getWebpackConfig().module?.rules as RuleSetRule[];
		expect( rules ).toHaveLength( 5 );
		expect( rules[ 0 ]?.test ).toEqual( /\.(svelte|svelte\.ts)$/ );
		expect( rules[ 1 ]?.test ).toEqual( /node_modules\/svelte\/.*\.mjs$/ );

		const mainRule = rules[ 0 ].use as RuleSetRule;
		// @ts-ignore
		expect( mainRule.options?.emitCss ).toEqual( true );
		// @ts-ignore
		expect( mainRule.options?.hotReload ).not.toBeDefined();
	} );


	test( 'Extensions', () => {
		const extensions = getWebpackConfig().resolve?.extensions;
		expect( extensions ).toHaveLength( 8 );
		expect( extensions ).toEqual( [ '.ts', '.tsx', '.js', '.jsx', '.json', '.pcss', '.svelte', '.mjs' ] );
	} );

	test( 'mainFields', () => {
		const mainFields = getWebpackConfig().resolve?.mainFields;
		expect( mainFields ).toHaveLength( 4 );
		expect( mainFields ).toEqual( [ 'svelte', 'browser', 'module', 'main' ] );
	} );

	test( 'Devtool', () => {
		const devtool = getWebpackConfig().devtool ?? undefined;
		expect( devtool ).not.toBeDefined();
	} );
} );
