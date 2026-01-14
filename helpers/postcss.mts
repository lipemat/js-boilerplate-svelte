import type {CSSModulesOptions, CSSOptions} from 'vite';
import * as postcssScss from 'postcss-scss';
import {getLocalIdent as getNextShortClass, usingShortCssClasses} from '@lipemat/js-boilerplate-shared/helpers/css-classnames.js';
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


/**
 * If using short CSS classes, add a '§' prefix to the generated class names.
 * Otherwise, do nothing.
 */
export function maybeGetLocalIdent(): { getLocalIdent: GetLocalIdent } | Record<string, never> {
	if ( 'production' !== process.env.NODE_ENV || ! usingShortCssClasses() ) {
		return {};
	}

	return {
		getLocalIdent: ( context, localIdentName, localName ) => '§' + getNextShortClass( context, localIdentName.interpolatedName, localName ),
	};
}


/**
 * If coming from PostCSS modules, include a Ⓜ before the hash to
 * distinguish from local <style> tag classnames.
 */
export function getLocalIdentName( postCssModules: boolean = true ): string {
	if ( 'production' === process.env.NODE_ENV ) {
		return '[contenthash:base52:5]';
	}

	if ( ! postCssModules ) {
		return '§[name]__[local]__[contenthash:base52:2]';
	}
	return '§Ⓜ[name]__[local]__[contenthash:base52:2]';
}


export function getPostCssConfig(): PostCSSConfig {
	const env = 'production' === process.env.NODE_ENV ? 'production' : 'development';
	const postcssOptions = getPostCSSConfig( env );

	return {
		plugins: postcssOptions.plugins,
		map: postcssOptions.sourceMap ?? false,
		parser: postcssScss,
		stringifier: undefined,
		syntax: undefined,
	};
}


function getShortCssClass( filename: string, name: string ): string {
	return '§' + getNextShortClass( {resourcePath: filename ?? ''}, '', name );
}
