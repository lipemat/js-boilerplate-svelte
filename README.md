# JS Boilerplate Svelte

Svelte extension for @lipemat/js-boilerplate

## Project Setup

Unless you project imports the `SvelteComponent` already, you'll get this TS error:
> TS2307: Cannot find module '<module name>.svelte' or its corresponding type declarations.

This may be fixed by adding the following module definition to your `types` folder:
```ts
declare module '*.svelte' {
	// @ts-ignore
	export {SvelteComponent as default} from 'svelte';
}
```

## Commands

`lipemat-js-boilerplate-svelte`

### start

The `start` command loads a dev server based on `vite`.

### dist

The `dist` command generated a production ready `dist` bundle of the project.

### check-types

The `check-types` command calls `svelte-check` to check the types in your Svelte project.
