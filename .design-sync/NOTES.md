# design-sync notes — gd-website

## What this repo is

Not a design-system package. It is a Next.js 16 App Router application with no
`dist/`, no library build, no Storybook, and `private: true`. Everything below
exists because the converter's package shape assumes a published package.

## Build wiring (all of it is required)

- **Explicit entry, not synth-entry.** `.design-sync/entry.ts` re-exports the 99
  bundlable component files. Synth-entry mode would `export *` from every file
  under `components/`, including the 21 that reach server-only code, and the
  esbuild bundle fails. Always build with `--entry .design-sync/entry.ts`.
- **`process` shim.** `.design-sync/process-shim.ts` is imported FIRST from
  `entry.ts`. Next internals (`next/link`, `next/image`) reference
  `process.env.*`, and without the shim every preview dies with
  `ReferenceError: process is not defined`. ESM hoisting is why it is a separate
  module rather than a statement in `entry.ts` — a bare statement would run
  after the re-exported modules had already evaluated.
- **Tailwind is compiled by hand.** `app/globals.css` is Tailwind v4 source, not
  shippable CSS. `.design-sync/tw-input.css` is generated from it (its own
  `@import`s stripped and re-added at top) plus `@source` directives for
  `../components`, `../app`, and `./previews`, plus `:root` definitions for
  `--font-general-sans`, `--font-jetbrains`, `--font-syne`.
  **Recompile before every build:**
  `npx @tailwindcss/cli -i .design-sync/tw-input.css -o .design-sync/.cache/compiled.css`
  Skipping this means any Tailwind class newly used in an authored preview is
  absent from the stylesheet and that preview renders unstyled.
- **Fonts replace `next/font`.** `.design-sync/fonts.css` declares `@font-face`
  for General Sans, JetBrains Mono, and Syne against the files in `app/fonts/`,
  wired via `cfg.extraFonts`. `next/font/local` does not exist outside Next, so
  without this the `--font-*` variables resolve to nothing and everything falls
  back to a system font.
- **Prop contracts are generated, not extracted.** `findTypesRoot` finds no
  `.d.ts` tree and falls back to `lib/`, yielding `[key: string]: unknown` for
  every component. `cfg.dtsPropsFor` is populated for 81 components by a
  ts-morph pass over the real sources: inline type literals verbatim, named
  interfaces resolved, cva `variants` blocks turned into string unions, repo
  types inlined structurally when short (<=220 chars, no generics) and degraded
  to `unknown` otherwise. React types get a `React.` prefix. The 17 components
  with no props are deliberately left out of the map.

## Environment

- Playwright drives the **system chromium** via `DS_CHROMIUM_PATH=/usr/bin/chromium`.
  Installed with `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` — no 200MB browser download
  is needed on this machine. Every validate and capture command needs that env var.
- npm blocks esbuild's postinstall (`allowScripts`); harmless, the platform
  binary still resolves.

## Scope

- 99 files re-exported, 196 names on `window.GDWebsite`, 98 preview cards.
- Compound parts (`CardHeader`, `SidebarMenuButton`, `SelectValue`, …) are in the
  bundle but deliberately have no card of their own.
- `BASE`, `MAX`, `SIGNAL` are constants, not components — excluded.
- **21 components are unsyncable** because they transitively reach `server-only`,
  `next/headers`, `next/navigation`, or `node:crypto` through server actions.
  The trace must follow *value* imports only; `import type` is erased by esbuild,
  and treating type imports as coupling wrongly excludes ~22 good components
  (the whole admin panel set).

## Preview authoring conventions

- Import from `"gd-website"`. `@/…` aliases also resolve (tsconfig paths).
- Dark-surface components (`StatusControl`, project headers, portal, auth) must
  be wrapped in `.panel-dark` or a dark background or they render white-on-white.
- Server-action props typed `(formData: FormData) => Promise<void>` take
  `async () => {}`.
- Realistic GD content only: AI-agency work for SMB clients, project names like
  "Northwind Logistics", weeks/milestones, the real status vocabulary
  (`discovery` `building` `review` `live` `retainer` `paused` `closed`).
- No code comments anywhere in this repo, previews included.

## Known render warns

- `[RENDER_BLANK]` on components whose floor card is genuinely tiny is expected
  until a preview is authored — it is not a failure.

## Re-sync risks

- `.design-sync/entry.ts` and `cfg.componentSrcMap` are generated snapshots of
  the component set. Adding or renaming a component, or changing what a component
  imports, does not update them — regenerate both by re-running the transitive
  trace, or the new component silently never syncs.
- `cfg.dtsPropsFor` is likewise a snapshot. Prop changes in source will NOT flow
  through until it is regenerated; a stale entry is worse than none because the
  design agent trusts it.
- The compiled CSS is a build artifact under `.cache/` and is regenerated, but
  only if the Tailwind command above is actually run first.
- `/usr/bin/chromium` is an Arch system package; a major bump could outpace the
  pinned playwright and break launch. Re-pin playwright if it does.
