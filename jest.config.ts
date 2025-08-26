import type {Config} from 'jest';

const config: Config = require( '@lipemat/js-boilerplate/config/jest.config' );

// Custom snapshot resolver for the boilerplate.
config.snapshotResolver = './tests/snapshot-resolver.ts';

config.moduleNameMapper = {
	...config.moduleNameMapper,
	'eslint-plugin-svelte': '<rootDir>/tests/mocks/eslint-plugin-svelte.ts',
	'@sveltejs/vite-plugin-svelte': '<rootDir>/tests/mocks/sveltejs__vite-plugin-svelte.ts'
};

export default config;
