import type {Plugin, UserConfig} from 'vite';
import PluginExternals from 'vite-plugin-external';
import PluginExternalGlobals from 'rollup-plugin-external-globals';


/**
 * Given a string, returns a new string with dash separators converted to
 * camel-case equivalent. This is not as aggressive as `_.camelCase`,
 * which would also upper-case letters following numbers.
 *
 * @param {string} slug Input dash-delimited string.
 *
 * @return {string} Camel-cased string.
 */
const camelCaseDash = ( slug: string ): string => slug.replace( /-([a-z])/g, ( match, letter ) => letter.toUpperCase() );

/**
 * Convert all wp libraries to the global variable, which are
 * available in WP core when the corresponding libraries are cued.
 *
 * @type {{wpExternals: *}}
 */
const wpExports: { [ name: string ]: string } = [
	'a11y',
	'annotations',
	'api-fetch',
	'autop',
	'blob',
	'block-directory',
	'block-editor',
	'block-library',
	'block-serialization-default-parser',
	'blocks',
	'commands',
	'components',
	'compose',
	'core-data',
	'data',
	'data-controls',
	'date',
	'deprecated',
	'dom',
	'dom-ready',
	'edit-post',
	'edit-site',
	'editor',
	'element',
	'escape-html',
	'hooks',
	'html-entities',
	'i18n',
	'is-shallow-equal',
	'keyboard-shortcuts',
	'keycodes',
	'list-reusable-blocks',
	'media-utils',
	'notices',
	'nux',
	'plugins',
	'primitives',
	'priority-queue',
	'redux-routine',
	'reusable-blocks',
	'rich-text',
	'server-side-render',
	'shortcode',
	'token-list',
	'url',
	'utils',
	'viewport',
	'warning',
	'wordcount',
].reduce(
	( externals, name ) => ( {
		...externals,
		[ `@wordpress/${name}` ]: `window.wp?.${camelCaseDash( name )}`,
	} ),
	{
		lodash: 'lodash',
		wp: 'wp',
		react: 'React',
		'react-dom': 'ReactDOM',
		'react-refresh/runtime': 'ReactRefreshRuntime',
		jquery: 'jQuery',
		tinymce: 'tinymce',
		moment: 'moment',
		'react/jsx-runtime': 'ReactJSXRuntime',
		backbone: 'Backbone',
	},
);


export default function wpExternals(): Plugin[] {
	const plugin: Plugin = {
		name: 'lipemat:wp-externals',
		apply: 'build',
		config(): UserConfig {
			return {
				optimizeDeps: {
					exclude: Object.keys( wpExports ),
				},
				build: {
					rollupOptions: {
						external: Object.keys( wpExports ),
						output: {
							globals: wpExports,
						},
					},
				},
			};
		},
	};

	return [
		plugin,
		PluginExternalGlobals( wpExports ),
		PluginExternals( {
			development: {
				externals: wpExports,
			},
		} ),
	];
}
