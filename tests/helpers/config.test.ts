import {createRequire} from 'node:module';

const requireModule = createRequire( import.meta.url );

describe( 'config.js', () => {
	test( 'Default TSConfig', () => {
		const {getTypeScriptConfig} = requireModule( '../../helpers/config' );
		expect( getTypeScriptConfig() ).toMatchSnapshot();
	} );
} );
