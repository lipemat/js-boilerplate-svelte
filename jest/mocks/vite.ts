import type {Logger, UserConfigFnObject} from 'vite';

module.exports = {
	createLogger: (): Partial<Logger> => ( {
		warnOnce: () => undefined,
	} ),
	defineConfig: ( config: UserConfigFnObject ): UserConfigFnObject => env => config( env ),
};
