import * as tsParser from '@typescript-eslint/parser';
import eslintPluginSvelte from 'eslint-plugin-svelte';
import type {Linter} from 'eslint';


/**
 * Eslint override for svelte files
 *
 * @requires @lipemat/eslint-config
 */
const SVELTE_CONFIG: Linter.Config = {
	files: [ '**/*.svelte', '*.svelte' ],
	languageOptions: {
		parserOptions: {
			parser: tsParser,
		},
	},
	rules: {
		'no-unused-vars': [ 0 ],
		'prefer-const': [ 0 ],
	},
};

module.exports = function( config: { configs: Linter.Config[] } ): { configs: Linter.Config[] } {

	/**
	 * Add ".svelte" files to `extraFileExtensions`
	 * @link https://github.com/sveltejs/svelte-eslint-parser?tab=readme-ov-file#parseroptionsparser
	 */
	const extraExtensions = config.configs[ 0 ]?.languageOptions?.parserOptions?.extraFileExtensions ?? [];
	extraExtensions.push( '.svelte' );
	if ( config.configs[ 0 ]?.languageOptions?.parserOptions ) {
		config.configs[ 0 ].languageOptions.parserOptions.extraFileExtensions = extraExtensions;
	}

	/**
	 * Add svelte configurations to the list.
	 *
	 * @link https://github.com/sveltejs/eslint-plugin-svelte?tab=readme-ov-file#configuration
	 */
	config.configs.push( ...eslintPluginSvelte.configs[ 'flat/recommended' ] );
	config.configs.push( SVELTE_CONFIG );

	return config;
};
