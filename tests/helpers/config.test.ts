describe( 'config.js', () => {
	test( 'Default TSConfig', () => {
		const {getTypeScriptConfig} = require( '../../helpers/config.js' );
		expect( getTypeScriptConfig() ).toMatchSnapshot();
	} );
} );
