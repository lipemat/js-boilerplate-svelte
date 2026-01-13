describe( 'wp-externals Helper', () => {
	it( 'Does not change', async () => {
		const plugin = await import( '../../../lib/wp-externals.mjs' );
		expect( plugin.default() ).toMatchSnapshot();
	} );
} );
