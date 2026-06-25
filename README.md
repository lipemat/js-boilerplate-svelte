# JS Boilerplate Svelte

Svelte extension for @lipemat/js-boilerplate

## Project Setup

### Index

Create a `svelte-index.ts` file in your `src` folder. This file is used as the entry point for your project.

### Exclude from Git

Add `dist-svelte` to your `.gitignore` file.

### Allow Servce Worker in CSP

Add `worker-src 'self' blob:` to your `Content-Security-Policy` header.

### Support Svelete Language Server with Yarn PNP

@notice Only works if the package.json is in the root of the project!

1. Install the package to your project `yarn add svelte-language-server`.
2. Generate the sdk `npx -y @yarnpkg/sdks base`.
3. In PHPStorm settings
    1. Language & Frameworks > TypeScript > Svelte
    2. Language Server package
        1. Select the '.yarn/sdks/svelte-language-server' directory.
            1. @notice Selecting the 'yarn:svelte-language-server' option provided by PHPStorm will not work!
    3. Radio button:
        1. Enabled.
4. Cleanup the unnecessary eslint and typescript sdk directories.
5. Commit the sdk to Git.

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

## Supporting Svelte Components in Jest

Add the following to your jest.config.ts file:

```ts
import config from '@lipemat/js-boilerplate-shared/config/jest.config.js';
import supportSvelteTests from '@lipemat/js-boilerplate-svelte/config/jest.config.mjs';

// pass `true` if you are using SvelteKit
const jestConfig: Config = supportSvelteTests( config, false );

export default jestConfig;
```

## Commands

`lipemat-js-boilerplate-svelte`

### start

The `start` command loads a dev server based on `vite`.

### dist

The `dist` command generated a production ready `dist` bundle of the project.

### check-types

The `check-types` command calls `svelte-check` to check the types in your Svelte project.
