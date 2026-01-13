describe( 'svelte.config', () => {
	test( 'it is a module', () => {
		const svelteConfig = require( '../../../config/svelte.config.mjs' );
		expect( typeof svelteConfig ).toBe( 'object' );
		expect( svelteConfig ).toMatchSnapshot();
	} );
} );
