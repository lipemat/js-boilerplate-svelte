import chokidar from 'chokidar';
import {exec} from 'child_process';
import chalk from 'chalk';

const toWatch = [
	'config/*.ts',
	'helpers/*.ts',
];

/**
 * Watch for changes in the config or helpers directory and run the build script when a change is detected.
 */
chokidar.watch( toWatch, {ignored: /(^|[\/\\])\../} )
	.on( 'change', path => {
		console.debug( chalk.yellowBright( '[watch]' ), `${path} changed` );
		exec( 'yarn run build', ( err, stdout ) => {
			if ( err ) {
				console.error( chalk.red( stdout ) );
			} else {
				console.debug( stdout );
			}
		} );
	} )
	.once( 'ready', () => {
		console.debug( chalk.greenBright( '[watch]' ), 'Watching for changes…' );
	} );
