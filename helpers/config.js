"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTypeScriptConfig = getTypeScriptConfig;
const requireJSON5 = require('require-json5');
/**
 * Get the TypeScript config used by Svelte preprocess.
 *
 * Using the config from @tsconfig/svelte/tsconfig.json verbatim.
 *
 * @notice We must use require-json5 because the config uses comments.
 */
function getTypeScriptConfig() {
    return requireJSON5(require.resolve('@tsconfig/svelte/tsconfig.json'));
}
