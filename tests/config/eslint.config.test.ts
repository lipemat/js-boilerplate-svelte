import ts from 'typescript-eslint';
import {createRequire} from 'node:module';
import type {ExtensionConfigs} from '@lipemat/eslint-config/helpers/config.js';

const requireModule = createRequire( import.meta.url );

const BASE = {
	configs: [ {
		languageOptions: {
			parserOptions: {},
		},
	} ],
};

let mockSharedHelpers: typeof import( '@lipemat/js-boilerplate-shared/helpers/config.js' );
let mockExtension: { readonly default: ( config: ExtensionConfigs ) => ExtensionConfigs };

beforeAll( async () => {
	mockSharedHelpers = await import( '@lipemat/js-boilerplate-shared/helpers/config.js' );
	mockExtension = await import( '../../config/eslint.config.js' );

	jest.mock( '@lipemat/js-boilerplate-shared/helpers/config.js', () => ( {
		...mockSharedHelpers,
		getExtensionsConfig: ( fileName: string, originalConfig: ExtensionConfigs ) => {
			if ( fileName !== 'eslint.config' ) {
				return mockSharedHelpers.getExtensionsConfig( fileName, originalConfig );
			}

			return mockExtension.default( {...originalConfig} );
		},
	} ) );
} );


describe( 'eslint.config', () => {
	test( 'Parser Options', () => {
		const svelteConfig = mockExtension.default( BASE ).configs[ 0 ];
		expect( svelteConfig.languageOptions?.parserOptions ).toEqual( {
			extraFileExtensions: [
				'.svelte',
			],
		} );
	} );


	test( 'Overrides', () => {
		const configs = mockExtension.default( BASE ).configs;
		const svelteConfig = configs[ configs.length - 2 ];

		expect( svelteConfig.files ).toEqual( [
			'**/*.svelte*',
			'*.svelte*',
		] );
		expect( JSON.stringify( svelteConfig.languageOptions?.parserOptions?.parser ) ).toEqual( JSON.stringify( ts.parser ) );
		expect( svelteConfig.rules ).toEqual( {
			'no-unused-vars': 'off',
			'prefer-const': 'off',
			'svelte/no-at-html-tags': 'off',
			'svelte/no-useless-mustaches': 'off',
		} );

		expect( configs[ configs.length - 1 ].rules ).toEqual( {
			'@lipemat/security/no-at-html-tags': 'error',
		} );
	} );


	test( 'Merged', () => {
		const config = requireModule( '@lipemat/eslint-config' );

		const original = config.default[ config.default.length - 6 ];
		const svelte = config.default[ config.default.length - 2 ];

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
