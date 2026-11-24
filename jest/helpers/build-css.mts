/**
 * Compile the postcss-modules fixtures to CSS using the same Vite
 * plugin chain as `dist`, so tests can assert the generated CSS.
 *
 * Usage: node jest/helpers/build-css.mts <development|production|serve> [module]
 * - `module` limits the entry to a single fixture file.
 * - A `module` ending in `.svelte` builds that component from `jest/fixtures/svelte`
 *   through `svelte()` with the package's `svelte.config`.
 * - `serve` transforms `module` through the dev server instead of building.
 * Prints JSON: {"css": "...", "js": "...", "warnings": []} with the built asset contents.
 * Loads the compiled `.mjs`/`.js` sources: run `yarn build` after changing them.
 */
import {cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import type {PluginOption} from 'vite';

export type Target = 'development' | 'production' | 'serve';

export interface BuildResult {
	css: string;
	js: string;
	warnings: string[];
}

function getTarget(): Target {
	const target: string = process.argv[ 2 ] ?? '';
	if ( 'development' !== target && 'production' !== target && 'serve' !== target ) {
		throw new Error( `Unknown target: ${target}` );
	}
	return target;
}

const target = getTarget();
const entryModule: string = process.argv[ 3 ] ?? '';
const isComponent: boolean = entryModule.endsWith( '.svelte' );
process.env.NODE_ENV = 'production' === target ? 'production' : 'development';

const repoRoot = resolve( dirname( fileURLToPath( import.meta.url ) ), '../..' );
const work = mkdtempSync( join( tmpdir(), 'postcss-modules-' ) );

// Modify before the postcss config module loads: it reads global fixture files at import time.
const {modifyPackageConfig}: typeof import( '@lipemat/js-boilerplate-shared/helpers/package-config' ) = await import( pathToFileURL( join( repoRoot, 'node_modules/@lipemat/js-boilerplate-shared/helpers/package-config.js' ) ).href );
modifyPackageConfig( {
	packageDirectory: join( repoRoot, 'jest/fixtures' ),
	shortCssClasses: false,
} );

const {
	build,
	createLogger,
	createServer,
}: typeof import( 'vite' ) = await import( pathToFileURL( join( repoRoot, 'node_modules/vite/dist/node/index.js' ) ).href );
const postCssConfig: typeof import( '../../lib/postcss-plugin.js' ).default = ( await import( pathToFileURL( join( repoRoot, 'lib/postcss-plugin.js' ) ).href ) ).default;
const cssModuleTypes: typeof import( '../../lib/css-module-types.mjs' ).default = ( await import( pathToFileURL( join( repoRoot, 'lib/css-module-types.mjs' ) ).href ) ).default;

cpSync( join( repoRoot, 'jest/fixtures/pcss' ), join( work, 'pcss' ), {
	recursive: true,
} );
cpSync( join( repoRoot, 'jest/fixtures/postcss-modules' ), work, {
	filter: ( source: string ): boolean => ! /(?:^|[/\\])(?:results|source)(?:[/\\]|$)/.test( source ),
	recursive: true,
} );
cpSync( join( repoRoot, 'jest/fixtures/svelte' ), join( work, 'svelte' ), {
	recursive: true,
} );

// Capture warnings instead of printing them, so tests can assert on them.
const warnings: string[] = [];
const logger = createLogger( 'silent' );
const warnOnce = logger.warnOnce;
logger.warnOnce = ( msg, options ): void => {
	warnings.push( msg );
	warnOnce( msg, options );
};

/**
 * Components also get `svelte()`, with `svelte.config` imported after
 * NODE_ENV is set because the config reads it at import time.
 */
async function getPlugins(): Promise<PluginOption[]> {
	const plugins: PluginOption[] = [ postCssConfig(), cssModuleTypes() ];
	if ( ! isComponent ) {
		return plugins;
	}
	const svelteConfig: typeof import( '../../config/svelte.config.mjs' ).default = ( await import( pathToFileURL( join( repoRoot, 'config/svelte.config.mjs' ) ).href ) ).default;
	const {svelte}: typeof import( '@sveltejs/vite-plugin-svelte' ) = await import( pathToFileURL( join( repoRoot, 'node_modules/@sveltejs/vite-plugin-svelte/src/index.js' ) ).href );
	plugins.push( svelte( {
		...svelteConfig,
		configFile: false,
		onwarn: ( warning ): void => {
			warnings.push( `${warning.code}: ${warning.message}` );
		},
	} ) );
	return plugins;
}

function getEntryImports(): string[] {
	if ( isComponent ) {
		return [
			`import Component from './svelte/${entryModule}';`,
			'console.log( Component );',
		];
	}
	if ( '' !== entryModule ) {
		return [
			`import * as entry from './${entryModule}';`,
			'console.log( entry );',
		];
	}
	return [
		'import \'./pcss/global.pcss\';',
		'import * as content from \'./content.module.pcss\';',
		'import * as globalNested from \'./global-nested.module.pcss\';',
		'import * as multipleMQ from \'./multiple-media-queries.module.pcss\';',
		'import * as shared from \'./shared.module.pcss\';',
		'import \'./default.module.pcss\';',
		'import \'./second-component.js\';',

		'console.log( content, globalNested, multipleMQ, shared );',
	];
}

writeFileSync( join( work, 'index.js' ), [ ...getEntryImports(), '' ].join( '\n' ) );
// Imports the same modules as index.js, as a second component would.
writeFileSync( join( work, 'second-component.js' ), [
	'import * as content from \'./content.module.pcss\';',
	'import * as shared from \'./shared.module.pcss\';',
	'console.log( content, shared );',
	'',
].join( '\n' ) );

const plugins: PluginOption[] = await getPlugins();

if ( 'serve' === target ) {
	if ( '' === entryModule || isComponent ) {
		throw new Error( 'The serve target requires a non-component module.' );
	}
	const server = await createServer( {
		configFile: false,
		customLogger: logger,
		logLevel: 'silent',
		plugins,
		root: work,
		server: {
			middlewareMode: true,
			ws: false,
		},
	} );
	try {
		const result = await server.transformRequest( `/${entryModule}` );
		process.stdout.write( JSON.stringify( {
			css: '',
			js: result?.code ?? '',
			warnings,
		} satisfies BuildResult ) );
	} finally {
		await server.close();
	}
} else {
	await build( {
		build: {
			emptyOutDir: true,
			minify: 'production' === target,
			outDir: join( work, 'dist' ),
			rolldownOptions: {
				external: isComponent ? [ /^svelte/ ] : [],
				input: join( work, 'index.js' ),
			},
		},
		configFile: false,
		customLogger: logger,
		logLevel: 'silent',
		plugins,
		root: work,
	} );

	const assetsDir = join( work, 'dist', 'assets' );
	const assets: string[] = readdirSync( assetsDir );

	function readAssets( extension: string ): string {
		return assets
			.filter( file => file.endsWith( extension ) )
			.map( file => readFileSync( join( assetsDir, file ), 'utf8' ) )
			.join( '\n' );
	}

	process.stdout.write( JSON.stringify( {
		css: readAssets( '.css' ),
		js: readAssets( '.js' ),
		warnings,
	} satisfies BuildResult ) );
}
