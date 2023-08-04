/**
 * Eslint override for svelte files
 *
 * @requires @lipemat/eslint-config
 */

const svelteConfig = {
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
};

module.exports = function( config ) {
	const localConfig = Object.assign( {}, config );
	try {
		localConfig.overrides.push( svelteConfig );
	} catch ( e ) {
		localConfig.overrides = [ svelteConfig ];
	}

	return {
		parserOptions: {
			...localConfig.parserOptions,
			extraFileExtensions: [
				...localConfig.extraFileExtensions ?? [],
				'.svelte',
			],
		},
		overrides: localConfig.overrides,
	};
};
