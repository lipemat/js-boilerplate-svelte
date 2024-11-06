describe( 'config.js', () => {
	test( 'Default TSConfig', () => {
		const {getTypeScriptConfig} = require( '../../helpers/config' );
		expect( getTypeScriptConfig() ).toMatchSnapshot();
	} );
} );
