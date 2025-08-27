import {getConfig} from '@lipemat/js-boilerplate/helpers/config';
import type {CSSOptions} from 'vite';
import * as postcssScss from 'postcss-scss';


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

export function getLocalIdentName(): string {
	return 'production' === process.env.NODE_ENV ? '[contenthash:base52:5]' : '§Ⓜ[name]__[local]__[contenthash:base52:2]';
}

export function getPostCssConfig(): PostCSSConfig {
	return POST_CSS_OPTIONS;
}
