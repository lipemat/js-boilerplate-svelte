import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import type {Linter} from 'eslint';
import type {ExtensionConfigs} from '@lipemat/eslint-config/types/helpers/config';

/**
 * Eslint override for svelte files
 *
 * @requires @lipemat/eslint-config
 */
const SVELTE_CONFIG: Linter.Config = {
	files: [ '**/*.svelte', '*.svelte' ],
	languageOptions: {
		parserOptions: {
			projectService: true,
			parser: ts.parser,
		},
	},
	rules: {
		'no-unused-vars': 'off',
		'prefer-const': 'off',
		'svelte/no-useless-mustaches': 'off',
	},
};

const extension = function( config: ExtensionConfigs ): ExtensionConfigs {
	/**
	 * Add ".svelte" files to `extraFileExtensions`
	 * @link https://github.com/sveltejs/svelte-eslint-parser?tab=readme-ov-file#parseroptionsparser
	 */
	const extraExtensions = config.configs[ 0 ]?.languageOptions?.parserOptions?.extraFileExtensions ?? [];
	extraExtensions.push( '.svelte' );
	if ( 'object' === typeof config.configs[ 0 ]?.languageOptions?.parserOptions ) {
		config.configs[ 0 ].languageOptions.parserOptions.extraFileExtensions = extraExtensions;
	}

	/**
	 * Add svelte configurations to the list.
	 *
	 * @link https://github.com/sveltejs/eslint-plugin-svelte?tab=readme-ov-file#configuration
	 */
	config.configs.push( ...svelte.configs.recommended );
	config.configs.push( SVELTE_CONFIG );

	return config;
};

module.exports = extension;
