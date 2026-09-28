import ts from 'typescript-eslint';
import svelte from 'eslint-plugin-svelte';
import type {Linter} from 'eslint';
import type {ExtensionConfigs} from '@lipemat/eslint-config/helpers/config.js';
import securityPlugin from '@lipemat/eslint-config/plugins/security/index.js';

type SvelteConfig = ExtensionConfigs['configs'][number];
type SvelteParser = NonNullable<SvelteConfig['languageOptions']>['parser'];

/**
 * Eslint override for svelte files
 *
 * @requires @lipemat/eslint-config
 */
const SVELTE_CONFIG: Linter.Config = {
	files: [ '**/*.svelte*', '*.svelte*' ],
	languageOptions: {
		parserOptions: {
			project: false,
			projectService: true,
			parser: ts.parser,
		},
	},
	rules: {
		'no-unused-vars': 'off',
		'prefer-const': 'off',
		'react-hooks/rules-of-hooks': 'off',
		'svelte/no-at-html-tags': 'off',
		'svelte/no-useless-mustaches': 'off',
	},
};

/**
 * Parser the consuming project already uses for TypeScript.
 *
 * Type-aware rules only receive usable type information from a parser loaded out of the
 * same dependency tree as the `typescript-eslint` plugin supplying those rules. Handing
 * them this package's own `ts.parser` works only while the two copies dedupe, and fails
 * silently with wrong types when they do not, so prefer the project's own parser.
 *
 * The extension is handed the TypeScript config group, whose sole parser is the one
 * wanted here. `ts.parser` remains the fallback for a group carrying none.
 */
function getProjectTypeScriptParser( configs: SvelteConfig[] ): SvelteParser {
	const entry = configs.find( item => undefined !== item.languageOptions?.parser );
	return entry?.languageOptions?.parser ?? ts.parser;
}

/**
 * Eslint override for `.svelte.js` and `.svelte.ts` rune modules.
 *
 * `eslint-plugin-svelte` hands these to `svelte-eslint-parser`, which yields no usable
 * type information for them, so type-aware rules such as `strict-boolean-expressions`
 * report on every conditional. These modules hold no markup, so the TypeScript parser
 * handles them on its own.
 */
function getSvelteModuleConfig( configs: SvelteConfig[] ): SvelteConfig {
	return {
		files: [ '**/*.svelte.[jt]s', '*.svelte.[jt]s' ],
		languageOptions: {
			parser: getProjectTypeScriptParser( configs ),
		},
	};
}

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
	const svelteModuleConfig = getSvelteModuleConfig( config.configs );

	config.configs.push( ...svelte.configs.recommended );
	config.configs.push( SVELTE_CONFIG );
	config.configs.push( securityPlugin.configs.svelte );
	config.configs.push( svelteModuleConfig );

	return config;
};

export default extension;
