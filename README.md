# JS Boilerplate Svelte

Svelte extension for @lipemat/js-boilerplate

## Project Setup

### Index

Create a `svelte-index.ts` file in your `src` folder. This file is used as the entry point for your project.

### Exclude from Git

Add `dist-svelte` to your `.gitignore` file.

### Allow Servce Worker in CSP

Add `worker-src 'self' blob:` to your `Content-Security-Policy` header.

### Types

Improvements to svelte TS definitions are included in this package. To use it, add it to your project:

#### In a .d.ts file
```
/// <reference types="@lipemat/js-boilerplate-svelte" />
```

#### In any .ts file (preferrably svelte-index.ts)

```ts
import '@lipemat/js-boilerplate-svelte';
````

## Commands

`lipemat-js-boilerplate-svelte`

### start

The `start` command loads a dev server based on `vite`.

### dist

The `dist` command generated a production ready `dist` bundle of the project.

### check-types

The `check-types` command calls `svelte-check` to check the types in your Svelte project.
