import type {Config} from 'jest';
import config from '@lipemat/js-boilerplate-shared/config/jest.config.js';

const jestConfig: Config = config;

jestConfig.moduleNameMapper = {
	...jestConfig.moduleNameMapper,
	'eslint-plugin-svelte': '<rootDir>/mocks/eslint-plugin-svelte.ts',
	'@sveltejs/vite-plugin-svelte': '<rootDir>/mocks/sveltejs__vite-plugin-svelte.ts',
};

export default jestConfig;
