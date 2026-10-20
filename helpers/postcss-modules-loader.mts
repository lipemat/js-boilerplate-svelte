import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import type {AcceptedPlugin} from 'postcss';

type ExportTokens = Record<string, string>;
type ResolveImport = ( id: string, importer: string ) => Promise<string> | string;

export interface PostcssModulesLoader {
	fetch( file: string, relativeTo: string, trace?: string ): Promise<ExportTokens>;
	readonly finalSource: string;
}

export type LoaderConstructor = new ( root: string, plugins: AcceptedPlugin[], resolveImport?: ResolveImport ) => PostcssModulesLoader;

const MAIN_HANDLERS = [ 'AtRule', 'AtRuleExit', 'Comment', 'CommentExit', 'Declaration', 'DeclarationExit', 'Document', 'DocumentExit', 'Once', 'prepare', 'Root', 'RootExit', 'Rule', 'RuleExit' ] as const;

/**
 * FileSystemLoader is missing from the postcss-modules exports map,
 * so require it by absolute path. The pinned postcss-modules version
 * must match the copy bundled with Vite.
 */
function requireFileSystemLoader(): LoaderConstructor {
	const requireModule = createRequire( import.meta.url );
	const packageDir = dirname( requireModule.resolve( 'postcss-modules/package.json' ) );
	// Registers the fs implementation FileSystemLoader reads with.
	requireModule( join( packageDir, 'build/index.js' ) );
	const moduleExports = requireModule( join( packageDir, 'build/FileSystemLoader.js' ) ) as { default: LoaderConstructor };
	return moduleExports.default;
}


/**
 * Plugins whose only handler is `OnceExit` transform the final output
 * (minify, pretty print, sort). They must not run per imported file:
 * they still run on the combined stylesheet after postcss-modules
 * prepends the imported sources.
 */
function isMainProcessPlugin( plugin: AcceptedPlugin ): boolean {
	if ( 'object' !== typeof plugin || ! ( 'OnceExit' in plugin ) ) {
		return true;
	}
	return MAIN_HANDLERS.some( handler => handler in plugin );
}


/**
 * Loader for postcss-modules which runs files referenced by
 * `composes: x from './file.pcss'` through the full PostCSS plugin
 * chain instead of only the scoping plugins.
 *
 * Vite places postcss-modules first in the PostCSS pipeline, so the
 * default FileSystemLoader inlines imported files without the project
 * plugins. The raw nested CSS then breaks the minifier and the
 * `dist` build.
 *
 * @param plugins - PostCSS plugins from the project config.
 */
export function createPostcssModulesLoader( plugins: AcceptedPlugin[] ): LoaderConstructor {
	const mainPlugins = plugins.filter( isMainProcessPlugin );
	const FileSystemLoader = requireFileSystemLoader();

	return class extends FileSystemLoader {
		constructor( root: string, scopingPlugins: AcceptedPlugin[], resolveImport?: ResolveImport ) {
			super( root, [ ...mainPlugins, ...scopingPlugins ], resolveImport );
		}
	};
}
