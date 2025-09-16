"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const svelte_preprocess_1 = require("svelte-preprocess");
const svelte_preprocess_cssmodules_1 = require("svelte-preprocess-cssmodules");
const config_1 = require("@lipemat/js-boilerplate/helpers/config");
const config_2 = require("../helpers/config");
const postcssOptions = (0, config_1.getConfig)('postcss.config');
/**
 * Using our standard options from `postcss.config.ts` with a few
 * explicit removals to satisfy TS configuration differences.
 */
const POST_CSS_OPTIONS = {
    ...postcssOptions,
    map: postcssOptions.sourceMap,
    parser: require('postcss-scss'),
    stringifier: undefined,
    syntax: undefined,
};
const SVELTE_LOADER_OPTIONS = {
    compilerOptions: {
        dev: true,
        cssHash: ({ hash, css, name }) => {
            const className = hash(css);
            return `§${name}__${className}`;
        },
    },
    emitCss: true,
    hotReload: true,
    preprocess: [
        (0, svelte_preprocess_1.sveltePreprocess)({
            postcss: POST_CSS_OPTIONS,
            typescript: (0, config_2.getTypeScriptConfig)(),
        }),
        // CSS module support for local <style> tags.
        (0, svelte_preprocess_cssmodules_1.cssModules)({
            localIdentName: '§Ⓜ[name]__[local]__[contenthash:base52:2]',
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
        // eval source map does not work with svelte.
        devtool: 'inline-source-map',
        resolve: {
            ...config.resolve,
            // Add the extensions to be used by webpack.
            extensions: [...extensions, '.svelte', '.mjs'],
            mainFields: ['svelte', ...config.resolve.mainFields ?? []],
        },
        module: {
            rules,
        },
    };
};
