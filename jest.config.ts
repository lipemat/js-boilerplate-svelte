import type {Config} from 'jest';
import config from '@lipemat/js-boilerplate-shared/config/jest.config.js';

const jestConfig: Config = config;

jestConfig.moduleNameMapper = {
	...jestConfig.moduleNameMapper,
	'eslint-plugin-svelte': '<rootDir>/tests/mocks/eslint-plugin-svelte.ts',
};

// Custom snapshot resolver for the boilerplate.
jestConfig.snapshotResolver = './tests/snapshot-resolver.ts';

export default jestConfig;
