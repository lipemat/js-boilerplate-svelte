import cssModulesPlugin, {config} from '../../../svelte-plugins/css-modules.mjs';
import {modifyPackageConfig} from '@lipemat/js-boilerplate-shared/helpers/package-config.js';

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
