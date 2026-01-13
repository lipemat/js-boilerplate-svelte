import {pathToFileURL} from 'node:url';

export async function importFresh<T extends object>( relativeToRoot: string ): Promise<T> {
	const url = pathToFileURL( relativeToRoot );
	// Bust ESM import cache so env changes are reflected.
	url.searchParams.set( 't', String( Date.now() ) );
	const mod = await import( url.href );
	return mod.default as T;
}
