describe( 'wp-externals Helper', () => {
	it( 'Does not change', async () => {
		const plugin = await import( '../../../lib/wp-externals.mts' );
		expect( plugin.default() ).toMatchSnapshot();
	} );
} );
