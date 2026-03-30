import type {Config} from 'jest';
import config from '@lipemat/js-boilerplate-shared/config/jest.config.js';

const jestConfig: Config = config;

jestConfig.transform = {
	'^.+\\.m?[tj]sx?$': [ 'babel-jest', {
		presets: [
			[ '@babel/preset-env', {modules: false, targets: {node: 'current'}} ],
			'@babel/preset-typescript',
		],
	} ],
};

jestConfig.moduleNameMapper = {
	...jestConfig.moduleNameMapper,
	'eslint-plugin-svelte': '<rootDir>/tests/mocks/eslint-plugin-svelte.ts',
};

// Custom snapshot resolver for the boilerplate.
jestConfig.snapshotResolver = './tests/snapshot-resolver.cjs';

jestConfig.testEnvironment = 'node';
jestConfig.extensionsToTreatAsEsm = [ '.ts', '.tsx', '.mts' ];

export default jestConfig;
