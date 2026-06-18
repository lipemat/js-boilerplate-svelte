# AGENTS.md

Guidance for AI agents working in `@lipemat/js-boilerplate-svelte` — a Svelte 5 build
extension for `@lipemat/js-boilerplate`. It ships a Vite-based CLI plus custom plugins
that bundle a consuming WordPress project's `src/svelte-index.ts` into `dist-svelte/`.

## Architecture

- **CLI entry** `bin/lipemat-js-boilerplate-svelte.js` dispatches three commands:
  `start` (dev server), `dist` (production build) — both run via `ts-node` against
  `bin/start.mts` / `bin/dist.mts` — and `check-types` (delegates to `svelte-check`).
- **Config layering**: `start`/`dist` load `config/vite.config.mjs`, but FIRST look for a
  `vite.config.mts` in the consuming project's package directory and prefer it. Resolution
  of the consuming project uses `getPackageConfig()` from `@lipemat/js-boilerplate-shared`.
- **Vite plugins** live in `lib/*.mts` and are composed in `config/vite.config.mts`.
  Build-only: `manifest-hash`, `cleanup-build`, `brotli-compress`. Serve-only:
  `running-flag`, `dev-server`. Always-on: `svelte`, `svelte-checker`, `wp-externals`,
  `css-module-types`, `postcss-plugin`. All plugin names are namespaced `lipemat:*`.
- **WordPress integration**: `lib/wp-externals.mts` marks WP packages (from shared
  `wp-externals`) as Rollup externals mapped to browser globals. Build base path is
  derived by stripping everything before `(wp-)content` from the dist dir.

## CSS Modules — two distinct paths (don't conflate)

- Local `<style>` blocks in `.svelte` files → `svelte-plugins/css-modules.mts`
  (`svelte-preprocess-cssmodules`), registered in `config/svelte.config.mts` preprocess.
- Imported `*.module.pcss` files → PostCSS via `lib/postcss-plugin.ts` + `helpers/postcss.mts`.
- `lib/css-module-types.mts` autogenerates `*.pcss.d.ts` typings (on build via `getJSON`,
  on save via the dev-server watcher). Class naming uses `§` prefix, plus `Ⓜ` for
  PostCSS-module classes, and short hashed classes in production.

## Build & Source Convention

- **Author `.mts`/`.ts`; never edit `.mjs`/`.js` or `.map` outputs** — they are generated
  by `tsc --project ./bin` (`yarn build`). Each `lib/foo.mts` has a committed `foo.mjs`.
- Imports reference the compiled extension: e.g. `import config from '../config/vite.config.mjs'`
  inside `.mts` source. Keep that `.mjs` import style.

## Workflows

- `yarn build` — compile `.mts` → `.mjs` (run after changing any source). `yarn watch` for watch mode.
- `yarn test` — Jest via `jest/jest.config.ts`. Many tests are snapshot-based
  (e.g. `jest/tests/lib/wp-externals.test.ts` imports the `.mjs` and `toMatchSnapshot()`).
- `yarn validate-ts` — `tsc --noEmit`. `yarn lint` — eslint with `--fix`.
- Tests import built `.mjs` files; `jest/jest.config.ts` maps `vite`,
  `vite-plugin-external`, `@sveltejs/vite-plugin-svelte`, `eslint-plugin-svelte` to mocks
  in `jest/mocks/`. Add a mock there when a test pulls in a heavy Vite/Svelte module.

## Conventions

- TypeScript/Svelte standards from `~/.copilot/instructions/*` apply: single quotes, Yoda
  conditions, no inline comments, strict boolean expressions, Svelte 5 runes mode.
- ESLint ignores all built `*.js`/`*.mjs` and `jest/fixtures|mocks` (see `eslint.config.mjs`).
- Use `'production' === process.env.NODE_ENV` to branch build vs dev behavior (set by the CLI).
