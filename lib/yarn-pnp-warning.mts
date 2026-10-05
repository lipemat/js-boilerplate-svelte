import {createLogger, type Logger, type LogOptions} from 'vite';

const logger: Logger = createLogger();
const loggerWarnOnce = logger.warnOnce;
/**
 * Suppress the warning about Yarn PnP and Vite.
 *
 * Until this actual stops working, we don't want to spam the console with this warning.
 *
 * @link https://github.com/vitejs/vite/pull/21906
 */
logger.warnOnce = ( msg: string, options: LogOptions | undefined ): void => {
	if ( msg.includes( 'Using Yarn PnP with Vite is discouraged and PnP-specific bugs will no longer be actively worked on.' ) ) {
		return;
	}
	loggerWarnOnce( msg, options );
};

export default logger;
