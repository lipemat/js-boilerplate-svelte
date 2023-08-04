describe( 'eslint.config', () => {
	test( 'Snapshot', () => {
		expect( require( '../../config/eslint.config.js' )( {} ) ).toMatchSnapshot();
	} );

	test( 'Parser Options', () => {
		expect( require( '../../config/eslint.config.js' )( {} ).parserOptions ).toEqual( {
			extraFileExtensions: [
				'.svelte',
			],
		} );
	} );

	test( 'Overrides', () => {
		expect( require( '../../config/eslint.config.js' )( {} ).overrides[ 0 ] ).toEqual( {
			files: [
				'*.svelte',
			],
			extends: [
				'plugin:svelte/recommended',
			],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
			},
			rules: {
				'prefer-const': [
					0,
				],
			},
		} );
	} );

	test( 'Merged', () => {
		const merged = require( '../../config/eslint.config.js' )( {
			overrides: [ {
				files: [ '**/*.ts', '**/*.tsx' ],
				plugins: [
					'@typescript-eslint',
				],
				rules: {
					'jsdoc/no-undefined-types': [ 0 ],
					'no-magic-numbers': [ 0 ],
					'no-redeclare': [ 0 ],
					'no-shadow': [ 0 ],
					'no-undef': [ 0 ],
					semi: [ 0 ],
					'@typescript-eslint/no-shadow': [ 'error' ],
					'@typescript-eslint/no-redeclare': [ 'error' ],
					'@typescript-eslint/no-unused-vars': 'error',
					'@typescript-eslint/strict-boolean-expressions': [
						'warn',
						{
							allowString: false,
							allowNumber: false,
						},
					],
					'@typescript-eslint/type-annotation-spacing': [ 'warn', {
						before: false,
						after: true,
						overrides: {
							arrow: {
								before: true,
								after: true,
							},
						},
					} ],
				},
			} ],
			parser: '@typescript-eslint/parser',
			parserOptions: {
				ecmaVersion: 7,
				project: './tsconfig.json',
				sourceType: 'module',
				warnOnUnsupportedTypeScriptVersion: false,
			},
		} );

		expect( merged ).toMatchSnapshot();

		expect( merged.parserOptions ).toEqual( {
			ecmaVersion: 7,
			extraFileExtensions: [
				'.svelte',
			],
			project: './tsconfig.json',
			sourceType: 'module',
			warnOnUnsupportedTypeScriptVersion: false,
		} );

		expect( merged.overrides[ 1 ] ).toEqual( {
			files: [
				'*.svelte',
			],
			extends: [
				'plugin:svelte/recommended',
			],
			parser: 'svelte-eslint-parser',
			parserOptions: {
				parser: '@typescript-eslint/parser',
			},
			rules: {
				'prefer-const': [
					0,
				],
			},
		} );

		expect( merged.overrides[ 0 ].files ).toEqual( [
			'**/*.ts',
			'**/*.tsx',
		] );
	} );
} );
