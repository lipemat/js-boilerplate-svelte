import {getConfig} from '@lipemat/js-boilerplate/helpers/config';
import type {CSSModulesOptions, CSSOptions} from 'vite';
import * as postcssScss from 'postcss-scss';
import {getLocalIdent, usingShortCssClasses} from '@lipemat/js-boilerplate/helpers/css-classnames';
import {GetLocalIdent} from 'svelte-preprocess-cssmodules/dist/lib';


type PostCSSConfig = Exclude<CSSOptions['postcss'], string | undefined> & {
	map: boolean;
}

const postcssOptions = getConfig( 'postcss.config' );

const POST_CSS_OPTIONS: PostCSSConfig = {
	plugins: postcssOptions.plugins ?? [],
	map: postcssOptions.sourceMap ?? false,
	parser: postcssScss,
	stringifier: undefined,
	syntax: undefined,
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


export function getLocalIdentName(): string {
	return 'production' === process.env.NODE_ENV ? '[contenthash:base52:5]' : '§Ⓜ[name]__[local]__[contenthash:base52:2]';
}

export function getPostCssConfig(): PostCSSConfig {
	return POST_CSS_OPTIONS;
}


function getShortCssClass( filename: string, name: string ): string {
	return '§' + getLocalIdent( {resourcePath: filename ?? ''}, '', name );
}
