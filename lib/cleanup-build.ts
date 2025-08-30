import {promises as fsp} from 'fs';
import {DIST_DIR} from '../config/vite.config';
import path from 'path';
import type {Plugin} from 'vite';


export default function cleanExceptRunning(): Plugin {
	return {
		name: 'lipemat:clean-except-running',
		apply: 'build',
		async buildStart() {
			const items = await fsp.readdir( DIST_DIR );
			await Promise.all( items.map( async item => {
				if ( '.running' === item ) {
					return;
				}
				const full = path.join( DIST_DIR, item );
				await fsp.rm( full, {recursive: true, force: true} );
			} ) );
		},
	};
}
