import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {type AcceptedPlugin, type Root, root as createRoot} from 'postcss';
import * as postcssScss from 'postcss-scss';

type ExportTokens = Record<string, string>;
type ResolveImport = ( id: string, importer: string ) => Promise<string> | string;

export interface PostcssModulesLoader {
	fetch( file: string, relativeTo: string, trace?: string ): Promise<ExportTokens>;

	readonly finalSource: Root | string;
	/** FileSystemLoader state: processed CSS per file. */
	sources: Record<string, string>;
	/** FileSystemLoader state: file path per import trace. */
	traces: Record<string, string>;
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
	const moduleExports = requireModule( join( packageDir, 'build/FileSystemLoader.js' ) ) as {
		default: LoaderConstructor
	};
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
 * Stock FileSystemLoader ordering: a file's dependencies sort
 * before the file itself.
 */
function traceKeySorter( a: string, b: string ): number {
	if ( a.length < b.length ) {
		return a < b.substring( 0, a.length ) ? -1 : 1;
	}
	if ( a.length > b.length ) {
		return a.substring( 0, b.length ) <= b ? -1 : 1;
	}
	return a < b ? -1 : 1;
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

		/**
		 * Rebuild the combined source as an AST so the nodes of each
		 * imported file keep their own `from` source.
		 *
		 * Stock FileSystemLoader returns a joined string, which
		 * postcss-modules prepends by parsing it without a `from`
		 * option: every imported declaration loses its source, so
		 * Vite's asset rewriting warns about the missing `from` and
		 * cannot resolve relative url() in composed-from files.
		 */
		override get finalSource(): Root | string {
			if ( 0 === Object.keys( this.traces ).length ) {
				return super.finalSource;
			}
			const combined = createRoot();
			const written = new Set<string>();
			for ( const trace of Object.keys( this.traces ).sort( traceKeySorter ) ) {
				const file = this.traces[ trace ];
				const source = 'string' === typeof file ? this.sources[ file ] : undefined;
				if ( 'string' !== typeof file || 'string' !== typeof source || written.has( file ) ) {
					continue;
				}
				written.add( file );
				combined.append( postcssScss.parse( source, {from: file} ).nodes );
			}
			return combined;
		}
	};
}
