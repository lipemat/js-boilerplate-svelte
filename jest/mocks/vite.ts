import type {UserConfigFnObject} from 'vite';

module.exports = {
	defineConfig: ( config: UserConfigFnObject ): UserConfigFnObject => env => config( env ),
};
