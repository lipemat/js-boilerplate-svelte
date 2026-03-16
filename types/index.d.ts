/// <reference types="svelte" />

/**
 * Enhancement types for Svelte to be included in all
 * projects which use this boilerplate.
 *
 * @notice To use add `import '@lipemat/js-boilerplate-svelte';` to the entry point of your project.
 */

// Allow specifying the type of props in components.
declare function $props<T>(): T;
