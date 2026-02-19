import type {Plugin} from 'vite';
import {compression} from 'vite-plugin-compression2';


export default function brotliCompress(): Plugin {
	return compression( {
		algorithms: [ 'brotliCompress' ],
		deleteOriginalAssets: false,
		include: /\.(js|css)$/,
	} );
}
