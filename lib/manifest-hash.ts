import {createHash} from 'crypto';
import {resolve} from 'path';
import {promises as fs} from 'fs';
import type {Manifest, ManifestChunk, Plugin} from 'vite';
import {type BinaryLike} from 'node:crypto';

declare module 'vite' {
	interface ManifestChunk {
		integrity: string;
		hash: string;
	}
}

export default function manifestSRI(): Plugin {
	const manifestPaths = [ 'manifest.json', ];

	return {
		name: 'vite-plugin-manifest',
		apply: 'build',
		enforce: 'post',
		async writeBundle( {dir} ) {
			await Promise.all( manifestPaths.map( path => augmentManifest( path, dir! ) ) );
		},
	};
}

async function augmentManifest( manifestPath: string, outDir: string ) {
	const resolveInOutDir = ( path: string ) => resolve( outDir, path );
	manifestPath = resolveInOutDir( manifestPath );

	const manifest: Manifest | undefined
		= await fs.readFile( manifestPath, 'utf-8' ).then( JSON.parse, () => undefined );

	if ( manifest ) {
		await Promise.all( Object.values( manifest ).map( async ( chunk: ManifestChunk ) => {
			chunk.integrity = calculateIntegrityHash( await fs.readFile( resolveInOutDir( chunk.file ) ), 'sha384' );
			chunk.hash = calculateFileHash( await fs.readFile( resolveInOutDir( chunk.file ) ) );
		} ) );

		await fs.writeFile( manifestPath, JSON.stringify( manifest, null, 2 ) );
	}
}


function calculateFileHash( source: Buffer ): string {
	return createHash( 'md5' )
		.update( source as BinaryLike )
		.digest( 'hex' )
		.substring( 0, 20 );
}


function calculateIntegrityHash( source: Buffer, algorithm: string ) {
	const hash = createHash( algorithm ).update( source as BinaryLike ).digest().toString( 'base64' );
	return `${algorithm.toLowerCase()}-${hash}`;
}
