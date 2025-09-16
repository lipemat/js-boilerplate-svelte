"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const svelte_preprocess_1 = require("svelte-preprocess");
const svelte_preprocess_cssmodules_1 = require("svelte-preprocess-cssmodules");
const loader_utils_1 = require("loader-utils");
const config_1 = require("@lipemat/js-boilerplate/helpers/config");
const css_classnames_1 = require("@lipemat/js-boilerplate/helpers/css-classnames");
const config_2 = require("../helpers/config");
const postcssOptions = (0, config_1.getConfig)('postcss.config');
/**
 * Using our standard options from `postcss.config.ts` with a few
 * explit removals to satifiy TS configuration differences.
 */
const POST_CSS_OPTIONS = {
    ...postcssOptions,
    map: postcssOptions.sourceMap,
    parser: require('postcss-scss'),
    stringifier: undefined,
    syntax: undefined,
};
/**
 * Options for the 'svelte-loader'.
 */
const SVELTE_LOADER_OPTIONS = {
    compilerOptions: {
        dev: false,
        /**
         * Strip the `svelte-` prefix from CSS class names.
         * Hash the CSS with base52 to prevent leading numbers or dashes.
         */
        cssHash: ({ filename, name, css }) => {
            if ((0, css_classnames_1.usingShortCssClasses)()) {
                return (0, css_classnames_1.getLocalIdent)({ resourcePath: filename ?? '' }, '', name);
            }
            // Mimic `localIdentName` from `css-loader`.
            // @ts-expect-error TS2345 -- loader-utils is typed to version 4 of webpack.
            return (0, loader_utils_1.interpolateName)({ resourcePath: filename ?? '' }, '[contenthash:base52:5]', {
                content: css,
                context: process.cwd(),
            });
        },
    },
    emitCss: true,
    preprocess: [
        (0, svelte_preprocess_1.sveltePreprocess)({
            postcss: POST_CSS_OPTIONS,
            typescript: (0, config_2.getTypeScriptConfig)(),
        }),
        // CSS module support for local <style> tags.
        (0, svelte_preprocess_cssmodules_1.cssModules)({
            ...(0, css_classnames_1.usingShortCssClasses)() ? {
                getLocalIdent: (context, localIdentName, localName) => (0, css_classnames_1.getLocalIdent)(context, localIdentName.interpolatedName, localName),
            } : {},
            localIdentName: '[contenthash:base52:5]',
            useAsDefaultScoping: true,
            mode: 'mixed',
        }),
    ],
};
module.exports = function (config) {
    if ('undefined' === typeof config.resolve) {
        config.resolve = {};
    }
    if ('undefined' === typeof config.resolve.mainFields) {
        // Webpack Defaults.
        config.resolve.mainFields = ['browser', 'module', 'main'];
    }
    let rules = [];
    if ('undefined' !== typeof config.module?.rules) {
        rules = [...config.module.rules];
    }
    // Required to prevent errors from Svelte on Webpack 5.
    rules.unshift({
        test: /node_modules\/svelte\/.*\.mjs$/,
        resolve: {
            fullySpecified: false,
        },
    });
    // Main svelte rule.
    rules.unshift({
        test: /\.(svelte|svelte\.ts)$/,
        use: {
            loader: 'svelte-loader',
            options: SVELTE_LOADER_OPTIONS,
        },
    });
    const extensions = 'undefined' !== typeof config.resolve.extensions ? config.resolve.extensions : [];
    return {
        resolve: {
            ...config.resolve,
            // Add the extensions to be used by webpack.
            extensions: [...extensions, '.svelte', '.mjs'],
            mainFields: ['svelte', ...config.resolve.mainFields],
        },
        module: {
            rules,
        },
    };
};
