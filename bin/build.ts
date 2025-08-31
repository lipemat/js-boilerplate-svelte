import {execSync} from 'node:child_process';
import chalk from 'chalk';

console.debug( chalk.blue( '[TS] ' ) + ' Compiling TS to CommonJS using the tsconfig.json in the bin directory.' );

execSync( 'tsc --project ./bin', {stdio: 'inherit'} );

console.debug( chalk.blueBright( '[TS] ' ) + ' Finished compiling the files.' );
