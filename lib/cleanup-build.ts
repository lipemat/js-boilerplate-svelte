import {promises as fsp} from 'fs';
import {DIR} from '../config/vite.config';
import path from 'path';
import type {Plugin} from 'vite';


export default function cleanExceptRunning(): Plugin {
	return {
		name: 'clean-except-running',
		apply: 'build',
		async buildStart() {
			try {
				const items = await fsp.readdir( DIR );
				await Promise.all( items.map( async item => {
					if ( item === '.running' ) {
						return;
					}
					const full = path.join( DIR, item );
					await fsp.rm( full, {recursive: true, force: true} );
				} ) );
			} catch ( e ) {
				// ignore if DIR does not exist yet
			}
		}
	};
}
