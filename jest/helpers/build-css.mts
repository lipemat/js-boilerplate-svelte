/**
 * Compile the postcss-modules fixtures to CSS using the same Vite
 * plugin chain as `dist`, so tests can assert the generated CSS.
 *
 * Usage: node jest/helpers/build-css.mts <development|production|serve> [module]
 * - `module` limits the entry to a single fixture file.
 * - `serve` transforms `module` through the dev server instead of building.
 * Prints JSON: {"css": "...", "js": "..."} with the built asset contents.
 */
import {cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

type Target = 'development' | 'production' | 'serve';

function getTarget(): Target {
	const target: string = process.argv[ 2 ] ?? '';
	if ( 'development' !== target && 'production' !== target && 'serve' !== target ) {
		throw new Error( `Unknown target: ${target}` );
	}
	return target;
}

const target = getTarget();
const entryModule: string = process.argv[ 3 ] ?? '';
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

function getEntryImports(): string[] {
	if ( '' !== entryModule ) {
		return [
			`import * as entry from './${entryModule}';`,
			'console.log( entry );',
		];
	}
	return [
		'import \'./pcss/global.pcss\';',
		'import * as content from \'./content.module.pcss\';',
		'import * as multipleMQ from \'./multiple-media-queries.module.pcss\';',
		'import * as shared from \'./shared.module.pcss\';',
		'import \'./default.module.pcss\';',
		'import \'./second-component.js\';',

		'console.log( content, multipleMQ, shared );',
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

// Capture warnings instead of printing them, so tests can assert on them.
const warnings: string[] = [];
const logger = createLogger( 'silent' );
const warnOnce = logger.warnOnce;
logger.warnOnce = ( msg, options ): void => {
	warnings.push( msg );
	warnOnce( msg, options );
};

if ( 'serve' === target ) {
	if ( '' === entryModule ) {
		throw new Error( 'The serve target requires a module.' );
	}
	const server = await createServer( {
		configFile: false,
		customLogger: logger,
		logLevel: 'silent',
		plugins: [ postCssConfig(), cssModuleTypes() ],
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
		} ) );
	} finally {
		await server.close();
	}
} else {
	await build( {
		build: {
			emptyOutDir: true,
			minify: 'production' === target,
			outDir: join( work, 'dist' ),
			rollupOptions: {input: join( work, 'index.js' )},
		},
		configFile: false,
		customLogger: logger,
		logLevel: 'silent',
		plugins: [ postCssConfig(), cssModuleTypes() ],
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
	} ) );
}
