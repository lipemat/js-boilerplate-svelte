import {NoCrossFileComposesLoader} from '../../../helpers/postcss-modules-loader.mjs';

describe( 'NoCrossFileComposesLoader', () => {
	it( 'rejects composes from another file', async () => {
		const loader = new NoCrossFileComposesLoader();
		await expect( loader.fetch( './shared.module.pcss', '/project/composed.module.pcss' ) ).rejects.toThrow( 'Cross-file composes is not supported' );
	} );


	it( 'names composed-from file and importing file', async () => {
		const loader = new NoCrossFileComposesLoader();
		await expect( loader.fetch( '../ünïcode dir/shared.module.pcss', '/project/composed.module.pcss' ) )
			.rejects.toThrow( '"../ünïcode dir/shared.module.pcss" in /project/composed.module.pcss' );
	} );


	it( 'suggests supported alternatives', async () => {
		const loader = new NoCrossFileComposesLoader();
		await expect( loader.fetch( './shared.module.pcss', '/project/composed.module.pcss' ) ).rejects.toThrow( 'from global' );
	} );
} );
