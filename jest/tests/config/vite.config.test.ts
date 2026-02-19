import config from '../../../config/vite.config.mjs';


describe( 'vite config', () => {
	it( 'Matches snapshot during build', () => {
		const viteConfig = config( {
			command: 'build',
			mode: 'production',
		} );
		expect( typeof viteConfig ).toBe( 'object' );
		expect( viteConfig ).not.toBeNull();
		expect( viteConfig ).toMatchSnapshot();
	} );


	it( 'Matches snapshot during dev', () => {
		const viteConfig = config( {
			command: 'serve',
			mode: 'development',
		} );
		expect( typeof viteConfig ).toBe( 'object' );
		expect( viteConfig ).not.toBeNull();
		expect( viteConfig ).toMatchSnapshot();
	} );
} );
