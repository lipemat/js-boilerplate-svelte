import ts from 'typescript-eslint';


const BASE = {
	configs: [ {
		languageOptions: {
			parserOptions: {},
		},
	} ],
};

jest.mock( '@lipemat/js-boilerplate/helpers/config.js', () => ( {
	...jest.requireActual( '@lipemat/js-boilerplate/helpers/config.js' ),
	getExtensionsConfig: ( fileName: string, originalConfig: object ) => {
		if ( fileName !== 'eslint.config' ) {
			return jest.requireActual( '@lipemat/js-boilerplate/helpers/config.js' ).getExtensionsConfig( fileName, originalConfig );
		}
		return require( '../../../config/eslint.config.ts' )( {...originalConfig} );
	},
} ) );


describe( 'eslint.config', () => {
	test( 'Parser Options', () => {
		const svelteConfig = require( '../../../config/eslint.config' )( BASE ).configs[ 0 ];
		expect( svelteConfig.languageOptions.parserOptions ).toEqual( {
			extraFileExtensions: [
				'.svelte',
			],
		} );
	} );


	test( 'Overrides', () => {
		const configs = require( '../../../config/eslint.config' )( BASE ).configs;
		const svelteConfig = configs[ configs.length - 1 ];

		expect( svelteConfig.files ).toEqual( [
			'**/*.svelte',
			'*.svelte',
		] );
		expect( JSON.stringify( svelteConfig.languageOptions.parserOptions.parser ) ).toEqual( JSON.stringify( ts.parser ) );
		expect( svelteConfig.rules ).toEqual( {
			'no-unused-vars': [
				0,
			],
			'prefer-const': [
				0,
			],
		} );
	} );


	test( 'Merged', () => {
		const config = require( '@lipemat/eslint-config' );

		const original = config.default[ config.default.length - 5 ];
		const svelte = config.default[ config.default.length - 1 ];

		expect( original.languageOptions.sourceType ).toEqual( 'module' );
		expect( original.languageOptions.ecmaVersion ).toEqual( 7 );
		expect( original.languageOptions.parserOptions ).toEqual( {
			extraFileExtensions: [
				'.svelte',
			],
			project: './tsconfig.json',
			warnOnUnsupportedTypeScriptVersion: false,
		} );

		expect( svelte.languageOptions.sourceType ).not.toBeDefined();
		expect( svelte.languageOptions.ecmaVersion ).not.toBeDefined();
		expect( original.languageOptions.parserOptions.extraFileExtensions ).toEqual( [
			'.svelte',
		] );
	} );
} );
