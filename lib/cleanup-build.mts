import {promises as fsp} from 'fs';
import {DIST_DIR} from '../config/vite.config.mjs';
import path from 'path';
import type {Plugin} from 'vite';


export default function cleanExceptRunning(): Plugin {
	return {
		name: 'lipemat:clean-except-running',
		apply: 'build',
		async buildStart() {
			let items: string[];
			try {
				items = await fsp.readdir( DIST_DIR );
			} catch {
				return;
			}

			// Delete all files and folders except .running
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
