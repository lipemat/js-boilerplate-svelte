/// <reference types="svelte" />

/**
 * Enchancement types for Svelte to be included in all
 * projects which use this boilerplate.
 */

// Allow specifying the type of props in components.
declare function $props<T>(): T;
