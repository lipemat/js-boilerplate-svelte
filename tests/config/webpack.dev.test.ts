import defaultConfig from '@lipemat/js-boilerplate/config/webpack.dev.js';
import webpackConfig from '../../config/webpack.dev.js';
import {getConfig} from '@lipemat/js-boilerplate/helpers/config.js';
import {type Configuration, type RuleSetRule} from 'webpack';


describe( 'webpack.dev.js', () => {
	function getWebpackConfig(): Configuration {
		// @ts-expect-error -- Will be fixed on next update.
		return webpackConfig( defaultConfig );
	}

	test( 'Snapshot', async () => {
		expect( getWebpackConfig() ).toMatchSnapshot( 'develop' );

		const full = await getConfig( 'webpack.dev.js' );
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
		expect( mainRule.options?.hotReload ).toEqual( true );
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
		expect( devtool ).toEqual( 'inline-source-map' );
	} );
} );
