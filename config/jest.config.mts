import type {Config} from 'jest';
import type {SyncTransformer, TransformOptions} from '@jest/transform';
import {dirname, join} from 'path';
import {fileURLToPath} from 'node:url';
import {getPackageConfig} from '@lipemat/js-boilerplate-shared/helpers/package-config.js';
import {createRequire} from 'node:module';

const require = createRequire( import.meta.url );
const thisFile = fileURLToPath( import.meta.url );
const svelteClient = join( dirname( require.resolve( 'svelte/package.json' ) ), 'src/index-client.js' );
const moduleRegex = /\.svelte\.[jt]s$/;

/**
 * Polyfill the Web Animations API in jsdom, which does not implement `Element.animate`.
 *
 * Svelte transitions (`fade`, `fly`, …) call `element.animate()`. This runs at module load
 * and is registered as a `setupFilesAfterEnv` entry, so no consumer setup file is required.
 * It is a no-op outside of a DOM environment (e.g. when the file is loaded as the Jest config
 * helper or transformer in the Node worker).
 *
 * @since 3.2.0
 */
function polyfillElementAnimate(): void {
	if ( 'undefined' === typeof Element || 'function' === typeof Element.prototype.animate ) {
		return;
	}
	Element.prototype.animate = function animate(): Animation {
		const stub: Partial<Animation> = {
			cancel: () => undefined,
			finish: () => undefined,
			onfinish: null,
			pause: () => undefined,
			play: () => undefined,
		};
		return stub as Animation;
	};
}

polyfillElementAnimate();

/**
 * Mock `goto` to prevent SvelteKit's navigation from running during tests.
 *
 * Added via moduleNameMapper in the Jest config when `isSvelteKit` is true, so it only applies in SvelteKit projects.
 */
export function goto(): Promise<void> {
	return Promise.resolve();
}

/**
 * Mock `resolve` to prevent SvelteKit's navigation from running during tests.
 *
 * Added via moduleNameMapper in the Jest config when `isSvelteKit` is true, so it only applies in SvelteKit projects.
 */
export function resolve( route: string, params: Record<string, string> = {} ): string {
	return Object.entries( params ).reduce( ( path, [ key, value ] ) => {
		return path.replace( `[${key}]`, value );
	}, route );
}


/**
 * Jest transformer factory used for `.svelte`, `.svelte.js`, and `.svelte.ts` files.
 *
 * Jest discovers this by importing the file referenced in `config.transform` and calling its
 * `createTransformer`. The compiled Svelte output (ESM) is handed to `babel-jest` so it runs
 * in Jest's CommonJS runtime. The heavy dependencies are required lazily so that loading this
 * file as a `setupFilesAfterEnv` entry stays cheap.
 *
 * @since 3.2.0
 */
export function createTransformer(): SyncTransformer {
	const {
		compile,
		compileModule
	} = require( 'svelte/compiler' ) as typeof import('svelte/compiler');
	const babelJest = ( require( 'babel-jest' ) as typeof import('babel-jest') ).default;


	const babelTransformer = babelJest.createTransformer( {
		babelrc: false,
		configFile: false,
		presets: [
			[ '@babel/preset-env', {targets: {node: 'current'}} ],
		],
		plugins: [
			[ 'babel-plugin-transform-import-meta', {module: 'ES6'} ],
		],
	} ) as SyncTransformer;

	return {
		canInstrument: false,
		process( source: string, filename: string, options: TransformOptions ) {
			const {js} = moduleRegex.test( filename )
				? compileModule( source, {filename, generate: 'client', dev: true} )
				: compile( source, {filename, generate: 'client', dev: true} );
			return babelTransformer.process( js.code, filename, options );
		},
	};
}

/**
 * Enhances the provided Jest configuration to support testing Svelte components.
 *
 * Applies every change required to compile and run Svelte 5 components under Jest:
 * - Adds `svelte` to the resolvable module extensions.
 * - Maps the `svelte` package to its client entry (PnP ignores `customExportConditions`,
 *   so without this Svelte resolves to its server build and `mount` is unavailable).
 * - Registers this file as the `.svelte` / `.svelte.js` / `.svelte.ts` transformer. Jest
 *   imports it and calls the `createTransformer` exported above, so no separate transformer
 *   file is required.
 * - Transforms every dependency (`transformIgnorePatterns: []`) so the ESM / TS packages in
 *   the graph (`svelte`, `esm-env`, `@wordpress/*` source, `uuid`, …) load.
 * - Switches to the `jsdom` environment with the project URL.
 *
 *
 * @example
 * ```ts
 * import type {Config} from 'jest';
 * import config from '@lipemat/js-boilerplate-shared/config/jest.config.js';
 * import supportSvelteTests from '@lipemat/js-boilerplate-svelte/config/jest.config.mjs';
 *
 * const jestConfig: Config = supportSvelteTests( config );
 *
 * export default jestConfig;
 * ```
 *
 * @since 3.2.0
 *
 * @param {Config} config - The existing Jest configuration to enhance.
 * @param {boolean} isSvelteKit - Whether the project is a SvelteKit project.
 *
 * @return {Config} The enhanced Jest configuration with Svelte support.
 */
export default function supportSvelteTests( config: Config, isSvelteKit: boolean = false ): Config {
	config.moduleFileExtensions = [ ...new Set( [
		...config.moduleFileExtensions ?? [],
		'ts',
		'tsx',
		'js',
		'jsx',
		'json',
		'svelte',
	] ) ];

	config.moduleNameMapper = {
		...config.moduleNameMapper,
		'^svelte$': svelteClient,
	};
	if ( isSvelteKit ) {
		config.moduleNameMapper[ '\\$lib/(.*?)(?:\\.js)?$' ] = '<rootDir>/../src/lib/$1';
		config.moduleNameMapper[ '^\\$app/navigation$' ] = thisFile;
		config.moduleNameMapper[ '^\\$app/paths$' ] = thisFile;
	}

	config.transform = {
		'^.+\\.svelte(\\.[jt]s)?$': thisFile,
		...config.transform,
	};

	config.transformIgnorePatterns = [];

	config.setupFilesAfterEnv = [ ...new Set( [
		...config.setupFilesAfterEnv ?? [],
		thisFile,
	] ) ];

	config.testEnvironment = 'jsdom';
	config.testEnvironmentOptions = {
		...config.testEnvironmentOptions,
		url: getPackageConfig().url,
		customExportConditions: [ 'browser', 'require', 'default' ],
	};

	return config;
}

/**
 * Jest imports the transformer via its default export and reads `createTransformer` from it,
 * so expose the factory on the default export. This lets a single file act as both the config
 * helper and the Svelte transformer.
 */
supportSvelteTests.createTransformer = createTransformer;
