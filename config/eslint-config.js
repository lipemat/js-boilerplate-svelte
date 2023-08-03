/**
 * Use via `extends: '@lipemat/js-boilerplate-svelte/config/eslint-config'` in your `.eslintrc.js`.
 *
 */
module.exports = {
	extends: [
		'@lipemat',
	],
	parserOptions: {
		extraFileExtensions: [
			'.svelte',
		],
	},
	overrides: [
		{
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
		},
	],
};
