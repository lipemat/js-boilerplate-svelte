/**
 * Loader for postcss-modules which rejects `composes: x from './file.pcss'`.
 *
 * Vite inlines composed-from files without the project PostCSS
 * plugins, so fail the same way during `start` and `dist`.
 */
export class NoCrossFileComposesLoader {
	async fetch( file: string, relativeTo: string ): Promise<never> {
		throw new Error( `Cross-file composes is not supported: "${file}" in ${relativeTo}. Compose within the same file, use "composes: <class> from global", or combine classes in the markup.` );
	}
}
