# js-boilerplate-svelte
Svelte extension for @lipemat/js-boilerplate

## Project Setup
Unless you project imports the `SvelteComponent` already, you'll get this TS error:
> TS2307: Cannot find module '<module name>.svelte' or its corresponding type declarations.

This may be fixed by adding the following module definition to your `type` folder:
```ts
declare module '*.svelte' {
	// @ts-ignore
	export {SvelteComponent as default} from 'svelte';
}
```
