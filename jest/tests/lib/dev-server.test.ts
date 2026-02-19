jest.mock( '@lipemat/js-boilerplate-shared/helpers/package-config.js' );
jest.mock( 'vite', () => ( {
	searchForWorkspaceRoot: jest.fn( () => '/workspace/root' ),
} ) );

import fs from 'fs';
import devServer from '../../../lib/dev-server.mjs';

const mockReadFileSync = jest.spyOn( fs, 'readFileSync' );

const expectedFs = {
	allow: [
		'/workspace/root',
		'.yarn/__virtual__',
	],
};

describe( 'devServer', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );


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
			server: {
				host: 'example.com',
				port: 5173,
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
			server: {
				host: 'secure.example.com',
				port: 5173,
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
			server: {
				host: 'secure.example.com',
				port: 5173,
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
			server: {
				host: 'secure.example.com',
				port: 5173,
				cors: true,
				fs: expectedFs,
			},
		} );
		expect( mockReadFileSync ).not.toHaveBeenCalled();
	} );
} );
