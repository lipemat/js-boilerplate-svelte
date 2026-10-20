import config from '../../../config/vite.config.mjs';


describe( 'vite config', () => {
	beforeEach( () => {
		jest.replaceProperty( process, 'env', {...process.env} );
		delete process.env.LIPEMAT_SVELTE_CHECK;
	} );

	afterEach( () => {
		jest.restoreAllMocks();
	} );


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


	it( 'excludes dev server plugins only inside checker process', () => {
		const normalConfig = config( {command: 'serve', mode: 'development'} );
		expect( normalConfig.plugins ).toEqual( expect.arrayContaining( [
			expect.objectContaining( {name: 'lipemat:running-flag'} ),
			expect.objectContaining( {name: 'lipemat:dev-server'} ),
		] ) );

		process.env.LIPEMAT_SVELTE_CHECK = 'true';

		const checkerConfig = config( {command: 'serve', mode: 'development'} );
		expect( checkerConfig.plugins ).not.toEqual( expect.arrayContaining( [
			expect.objectContaining( {name: 'lipemat:running-flag'} ),
		] ) );
		expect( checkerConfig.plugins ).not.toEqual( expect.arrayContaining( [
			expect.objectContaining( {name: 'lipemat:dev-server'} ),
		] ) );
		expect( checkerConfig.plugins ).toHaveLength( 5 );
	} );


	it.each( [ '', 'false', '1' ] )( 'retains dev server plugins for checker flag "%s"', flag => {
		process.env.LIPEMAT_SVELTE_CHECK = flag;

		const viteConfig = config( {command: 'serve', mode: 'development'} );
		expect( viteConfig.plugins ).toEqual( expect.arrayContaining( [
			expect.objectContaining( {name: 'lipemat:running-flag'} ),
			expect.objectContaining( {name: 'lipemat:dev-server'} ),
		] ) );
	} );


	it( 'retains production build plugins inside checker process', () => {
		const normalConfig = config( {command: 'build', mode: 'production'} );
		expect( normalConfig.plugins ).toEqual( expect.arrayContaining( [
			expect.objectContaining( {name: 'lipemat:manifest-hash'} ),
			expect.objectContaining( {name: 'lipemat:clean-except-running'} ),
			expect.objectContaining( {name: 'vite-plugin-compression'} ),
		] ) );

		process.env.LIPEMAT_SVELTE_CHECK = 'true';

		const checkerConfig = config( {command: 'build', mode: 'production'} );
		expect( checkerConfig.plugins ).toHaveLength( 8 );
		expect( checkerConfig.plugins ).toEqual( expect.arrayContaining( [
			expect.objectContaining( {name: 'lipemat:manifest-hash'} ),
			expect.objectContaining( {name: 'lipemat:clean-except-running'} ),
			expect.objectContaining( {name: 'vite-plugin-compression'} ),
		] ) );
	} );
} );
