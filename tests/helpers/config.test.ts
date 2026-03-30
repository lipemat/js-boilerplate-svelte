describe( 'config.js', () => {
	test( 'Default TSConfig', async () => {
		const {getTypeScriptConfig} = await import( '../../helpers/config.js' );
		expect( getTypeScriptConfig() ).toMatchSnapshot();
	} );
} );
