jest.mock( '@lipemat/js-boilerplate-shared/helpers/package-config.js' );
jest.mock( 'vite', () => ( {
	searchForWorkspaceRoot: jest.fn( () => '/workspace/root' ),
} ) );

import fs from 'fs';
import devServer, {detectPort} from '../../../lib/dev-server.mjs';

const mockReadFileSync = jest.spyOn( fs, 'readFileSync' );

const expectedFs = {
	allow: [
		'/workspace/root',
		'.yarn/__virtual__',
	],
};

const defaultPreview = {
	port: 4173,
	strictPort: false,
};

const originalPort = process.env.PORT;

beforeEach( () => {
	jest.clearAllMocks();
	delete process.env.PORT;
} );

afterAll( () => {
	if ( 'string' === typeof originalPort ) {
		process.env.PORT = originalPort;
	}
} );


describe( 'detectPort', () => {
	const VALID_PORTS = [
		{expected: 1, port: '1'},
		{expected: 3000, port: '3000'},
		{expected: 65535, port: '65535'},
		{expected: 3000, port: ' 3000 '},
	];

	it.each( VALID_PORTS )( 'returns $expected for PORT "$port"', ( {expected, port} ) => {
		process.env.PORT = port;

		expect( detectPort() ).toBe( expected );
	} );


	const INVALID_PORTS = [
		{port: ''},
		{port: ' '},
		{port: 'abc'},
		{port: '3000abc'},
		{port: '30.5'},
		{port: '-1'},
		{port: '0'},
		{port: '65536'},
		{port: 'NaN'},
		{port: 'Infinity'},
	];

	it.each( INVALID_PORTS )( 'returns undefined for invalid PORT "$port"', ( {port} ) => {
		process.env.PORT = port;

		expect( detectPort() ).toBeUndefined();
	} );


	it( 'returns undefined when PORT is not set', () => {
		expect( detectPort() ).toBeUndefined();
	} );


	it( 'reflects a PORT set after a previous call', () => {
		expect( detectPort() ).toBeUndefined();

		process.env.PORT = '3000';

		expect( detectPort() ).toBe( 3000 );
	} );
} );


describe( 'devServer', () => {
	it( 'returns a plugin with the correct name and apply', () => {
		const {getPackageConfig} = require( '@lipemat/js-boilerplate-shared/helpers/package-config.js' );
		getPackageConfig.mockReturnValue( {
			url: 'http://example.com',
			certificates: undefined,
		} );

		const plugin = devServer();

		expect( plugin.name ).toBe( 'lipemat:dev-server' );
		expect( plugin.apply ).toBe( 'serve' );
	} );


	it( 'configures a server without SSL for HTTP', () => {
		const {getPackageConfig} = require( '@lipemat/js-boilerplate-shared/helpers/package-config.js' );
		getPackageConfig.mockReturnValue( {
			url: 'http://example.com:3000',
		} );

		const plugin = devServer();
		const config = plugin.config();

		expect( config ).toEqual( {
			preview: {
				port: 4173,
				strictPort: false,
			},
			server: {
				host: 'example.com',
				port: 5173,
				strictPort: false,
				cors: true,
				fs: expectedFs,
			},
		} );
		expect( mockReadFileSync ).not.toHaveBeenCalled();
	} );


	it( 'configures a server with SSL for HTTPS', () => {
		const {getPackageConfig} = require( '@lipemat/js-boilerplate-shared/helpers/package-config.js' );
		getPackageConfig.mockReturnValue( {
			url: 'https://secure.example.com',
			certificates: {
				cert: '/path/to/cert.pem',
				key: '/path/to/key.pem',
			},
		} );

		mockReadFileSync.mockImplementation( path => {
			if ( '/path/to/cert.pem' === path ) {
				return Buffer.from( 'cert-content' );
			}
			if ( '/path/to/key.pem' === path ) {
				return Buffer.from( 'key-content' );
			}
			return Buffer.from( '' );
		} );

		const plugin = devServer();
		const config = plugin.config();

		expect( config ).toEqual( {
			preview: {
				port: 4173,
				strictPort: false,
			},
			server: {
				host: 'secure.example.com',
				port: 5173,
				strictPort: false,
				cors: true,
				fs: expectedFs,
				https: {
					cert: Buffer.from( 'cert-content' ),
					key: Buffer.from( 'key-content' ),
				},
			},
		} );
		expect( mockReadFileSync ).toHaveBeenCalledWith( '/path/to/cert.pem' );
		expect( mockReadFileSync ).toHaveBeenCalledWith( '/path/to/key.pem' );
	} );


	it( 'does not add SSL when certificates is not an object', () => {
		const {getPackageConfig} = require( '@lipemat/js-boilerplate-shared/helpers/package-config.js' );
		getPackageConfig.mockReturnValue( {
			url: 'https://secure.example.com',
			certificates: undefined,
		} );

		const plugin = devServer();
		const config = plugin.config();

		expect( config ).toEqual( {
			preview: {
				port: 4173,
				strictPort: false,
			},
			server: {
				host: 'secure.example.com',
				port: 5173,
				strictPort: false,
				cors: true,
				fs: expectedFs,
			},
		} );
		expect( mockReadFileSync ).not.toHaveBeenCalled();
	} );


	it( 'it does not add SSL when the URL is not HTTPS', () => {
		const {getPackageConfig} = require( '@lipemat/js-boilerplate-shared/helpers/package-config.js' );
		getPackageConfig.mockReturnValue( {
			url: 'http://secure.example.com',
			certificates: {
				cert: '/path/to/cert.pem',
				key: '/path/to/key.pem',
			},
		} );

		expect( devServer().config() ).toEqual( {
			preview: {
				port: 4173,
				strictPort: false,
			},
			server: {
				host: 'secure.example.com',
				port: 5173,
				strictPort: false,
				cors: true,
				fs: expectedFs,
			},
		} );
		expect( mockReadFileSync ).not.toHaveBeenCalled();
	} );


	describe( 'PORT environment variable', () => {
		beforeEach( () => {
			const {getPackageConfig} = require( '@lipemat/js-boilerplate-shared/helpers/package-config.js' );
			getPackageConfig.mockReturnValue( {
				url: 'https://example.com',
			} );
		} );


		it( 'uses default ports without strict port when PORT is not set', () => {
			expect( devServer().config() ).toEqual( expect.objectContaining( {
				server: expect.objectContaining( {
					port: 5173,
					strictPort: false,
				} ),
				preview: defaultPreview,
			} ) );
		} );


		it( 'uses PORT for both dev and preview servers with strict port', () => {
			process.env.PORT = '3000';

			expect( devServer().config() ).toEqual( expect.objectContaining( {
				server: expect.objectContaining( {
					port: 3000,
					strictPort: true,
				} ),
				preview: {
					port: 3000,
					strictPort: true,
				},
			} ) );
		} );


		it( 'keeps host, cors, and fs when PORT is set', () => {
			process.env.PORT = '3000';

			expect( devServer().config() ).toEqual( expect.objectContaining( {
				server: expect.objectContaining( {
					cors: true,
					fs: expectedFs,
					host: 'example.com',
				} ),
			} ) );
		} );


		it( 'falls back to default ports when PORT is invalid', () => {
			process.env.PORT = 'abc';

			expect( devServer().config() ).toEqual( expect.objectContaining( {
				server: expect.objectContaining( {
					port: 5173,
					strictPort: false,
				} ),
				preview: defaultPreview,
			} ) );
		} );


		it( 'accepts the highest valid PORT', () => {
			process.env.PORT = '65535';

			expect( devServer().config() ).toEqual( expect.objectContaining( {
				server: expect.objectContaining( {
					port: 65535,
					strictPort: true,
				} ),
				preview: {
					port: 65535,
					strictPort: true,
				},
			} ) );
		} );
	} );
} );
