import type {CSSModulesOptions, CSSOptions} from 'vite';
import * as postcssScss from 'postcss-scss';
import {getLocalIdent, usingShortCssClasses} from '@lipemat/js-boilerplate-shared/helpers/css-classnames.js';
import {getPostCSSConfig} from '@lipemat/js-boilerplate-shared/helpers/postcss-config.js';


type PostCSSConfig = Exclude<CSSOptions['postcss'], string | undefined> & {
	map: boolean;
}

interface Context {
	context: string;
	resourcePath: string;
}

interface LocalIdentName {
	template: string;
	interpolatedName: string;
}

interface Options {
	markup: string;
	style: string;
}

export type GetLocalIdent = {
	( context: Context, localIdentName: LocalIdentName, localName: string, options: Options ): string;
};

export function getGeneratedScopedName(): CSSModulesOptions['generateScopedName'] {
	if ( usingShortCssClasses() && 'production' === process.env.NODE_ENV ) {
		return getShortCssClass;
	}
	return getLocalIdentName();
}


export function maybeGetLocalIdent(): { getLocalIdent: GetLocalIdent } | Record<string, never> {
	if ( ! usingShortCssClasses() || 'production' !== process.env.NODE_ENV ) {
		return {};
	}

	return {
		getLocalIdent: ( context, localIdentName, localName ) => '§' + getLocalIdent( context, localIdentName.interpolatedName, localName ),
	};
}


export function getLocalIdentName( modules: boolean = true ): string {
	let name = '§Ⓜ[name]__[local]__[contenthash:base52:2]';
	if ( ! modules ) {
		name = '§[name]__[local]__[contenthash:base52:2]';
	}

	return 'production' === process.env.NODE_ENV ? '[contenthash:base52:5]' : name;
}

export function getPostCssConfig( kit: boolean = false ): PostCSSConfig {
	const env = 'production' === process.env.NODE_ENV ? 'production' : 'development';
	const postcssOptions = getPostCSSConfig( env );

	if ( Array.isArray( postcssOptions.plugins ) ) {
		// @ts-expect-error: Unable to filter the possibilities.
		postcssOptions.plugins = postcssOptions.plugins.filter( ( plugin ) => {
			if ( plugin && 'postcssPlugin' in plugin ) {
				return plugin.postcssPlugin !== 'clean';
			}
			return true;
		} );
	}

	return {
		plugins: postcssOptions.plugins,
		map: postcssOptions.sourceMap ?? false,
		parser: postcssScss,
		stringifier: undefined,
		syntax: undefined,
	};
}


function getShortCssClass( filename: string, name: string ): string {
	return '§' + getLocalIdent( {resourcePath: filename ?? ''}, '', name );
}
