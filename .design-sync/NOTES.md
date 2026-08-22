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

## Capture harness patch (REQUIRED — re-apply after every re-sync)

`package-capture.mjs` pins a fixed clock and never scrolls, so GSAP `ScrollTrigger`
effects never fire. Every component that wraps its content in `<Reveal>` (the
marketing sections especially) then captures at `opacity: 0` and looks empty.

The fix is to capture with reduced motion emulated, which makes `useReducedMotion()`
return true so `Reveal` and every other GSAP effect bails early and renders its
content statically — the repo's own intended reduced-motion behaviour, not a hack:

```
python3 - <<'EOF'
import pathlib
p = pathlib.Path('.ds-sync/package-capture.mjs')
s = p.read_text()
s = s.replace(
  "const page = await browser.newPage({ viewport: { width: 900, height: 700 } });",
  "const page = await browser.newPage({ viewport: { width: 900, height: 700 }, reducedMotion: 'reduce' });")
p.write_text(s)
EOF
```

`.ds-sync/` is re-copied from the skill on every re-sync, so this patch is lost each
time and MUST be re-applied before capturing. It cannot live in
`.design-sync/overrides/` — that mechanism only covers `lib/*.mjs`.

## Authoring gotchas learned in the preview campaign

- **Arbitrary Tailwind values must already exist in the shipped stylesheet.**
  Capture serves `ds-bundle/_ds_bundle.css`, which only `package-build.mjs`
  regenerates. Recompiling into `.design-sync/.cache/compiled.css` does not reach
  it, and `preview-rebuild.mjs` never rewrites it. So a preview using a brand-new
  arbitrary class (`h-[420px]`, `inset-x-[30%]`) gets no rule at all — and when the
  element's children are all `position: absolute`, the parent's auto height
  collapses to 0 and the card screenshots blank white. Before using an arbitrary
  value in a preview, grep `_ds_bundle.css` for the escaped class. Orchestrator
  rebuilds pick new classes up via `@source ./previews`; agents mid-wave cannot.
- **Every `hero/*` component except `HeroProvider`/`HeroSection` needs context.**
  `AuditForm` and friends read `useHero()` and throw outside `<HeroProvider>`.
  Compose them inside their provider — that is the only true render.
- **Two different document shapes in the projects surface.** `BoardSurface` and
  `IdeaEditor` take real Tiptap JSON (`{type:"doc",content:[…]}`); `BlockEditor`
  and `BlockView` take the app's lighter `Block[]`. They are not interchangeable.
- **Dark-pill components need a `.panel-dark` ancestor to be visible at all.**
  `ShareProject`'s trigger (`bg-white/[0.08] text-white`) and `PortalTabs`'
  `TabsList` (`text-white/35`) have no background of their own — they are meant to
  sit inside a dark header block. On the default light preview background they are
  invisible, which reads as "renders BLANK". Wrap them the way the app does
  (`PortalHero` / the `panel-dark` project header), not in a neutral box.
- **`position: absolute` roots need a fixed-height relative wrapper.**
  `SuggestionsPanel` is `absolute inset-y-0 right-0`; without
  `style={{height: 560}} className="relative overflow-hidden …"` it collapses to
  zero height. `WeekWorkBoard.tsx` is the precedent to copy. `SidebarProvider` is
  the exception — its `min-h-svh` already supplies height for the fixed rail.
- **Below `lg` (1024px) the 900px capture width changes what renders.**
  `PortfolioResults`' real `<table>` is `hidden lg:block`, so at 900px the table
  story silently renders the grid fallback — the fix is
  `cfg.overrides.PortfolioResults.viewport`, not a story rewrite. `PortalCard`
  likewise shows only its mobile column, matching real responsive behaviour.
  Per-story shots are `fullPage:false` at a fixed viewport, so anything below the
  fold is never captured — height problems are a `viewport` override, not trimming.
- **Compound `projects/*` fixtures need the real source types.** `MilestoneWeek`,
  `MilestoneCard` (`data/project-detail.ts`) and `CardStatus`
  (`lib/projects/board.ts`) flatten to `unknown` in `dtsPropsFor`; read the source
  to build realistic fixtures rather than guessing.

  The failure is SILENT — a missing class is a no-op, not an error. It caused a
  real overlap bug in the campaign: `mt-24` was absent from the shipped stylesheet,
  so HeroCopy's title, lead, and CTA stacked on top of each other. Authoring agents
  should put wrapper *geometry* in an inline `style` rather than risk it; the
  orchestrator's rebuild compiles preview classes properly via `@source ./previews`.

## Optional cardMode polish (not defects)

At the 700px capture viewport, `EnvPanel`'s last upload row, `WeekPlan`'s
`OwnerWithOpenWeek` cell (its embedded Tiptap editor), and `SiteFooter` crop. The content is complete; only the screenshot is cut. If it ever
matters, give them `cfg.overrides.<Name>: {"cardMode": "column"}`.

## States that are genuinely not statically renderable

Documented so a future run does not treat them as failures to chase:

- `AuthForm` error banner — error comes from `useActionState` after a real submit;
  initial state is always empty. Its cell shows the clean form.
- `BlockEditor` add-menu grid — only opens on click.
- `FormDatePicker` / `FormSelect` open popover — not prop-controllable.
- `LoaderVisual` `leaving` — `.site-loader-leaving` sets `opacity: 0` as its resting
  end state, so it screenshots blank by design. Replaced with a second progress value.
- `SiteLoader` — takes **zero props**; its whole state machine is real wall-clock
  timers (850ms → +140ms → +520ms → `stage: "hidden"`, which returns `null`).
  `page.clock.setFixedTime` pins `Date`, it does not pause real timers, and
  `package-capture.mjs`'s `goto` + `settle()` (fonts + image decode) already burns
  more than the ~1.5s hide sequence — so every capture lands after the component has
  unmounted itself. Unlike `LoaderVisual` there is no prop to freeze a stage on.
  Not authorable: it ships the floor card until the source gains a dev-only stage
  override, or capture screenshots immediately post-mount instead of after `settle()`.

## Source findings (real bugs, not sync artifacts)

- `components/admin/projects/block-editor.tsx`: the callout-tone `FormSelect`
  trigger is fixed at `w-[104px]`, which clips the option label "Important" to
  "Importan". Pre-existing; left untouched by the sync.
- `components/ui/tabs.tsx`: the `orientation` prop is **dead**. It is destructured
  and written only as a static `data-orientation` attribute — never forwarded to
  `TabsPrimitive.Root`. Radix derives its own `data-orientation` from its internal
  context (default `horizontal`), so `orientation="vertical"` has no visible effect;
  an authored vertical story rendered identically to the horizontal one. Zero real
  callers (`grep -rn "orientation=" components app`). Fix by forwarding it to the
  primitive, or delete the prop.
- `components/projects/share-project.tsx` (`ShareProject`) has **no callers** left
  in `app/` or `components/` — apparently superseded by `ShareContainers`. Its
  preview fixtures were built from its own prop contract, not a real call site.

## Known render warns

- `[RENDER_BLANK]` on components whose floor card is genuinely tiny is expected
  until a preview is authored — it is not a failure.

## `public/` assets are not served during capture

`SiteNav` renders `next/image` against `/logo.png` and `/full-logo.png` — absolute
`public/` paths. `public/` is not copied into `ds-bundle`, so those requests 404 in
the capture browser and the logo mark screenshots blank. The nav shell itself (pill
links, `Book a call` CTA, blur/border chrome) is fully styled and correct.

This is build wiring, not a preview defect — no prop or fixture substitutes an asset
the component fetches by hardcoded absolute path. `SiteNav` is the **only** affected
component (`grep -rn 'src="/' components/` finds nothing else; `CASE_THUMBS` are
inline SVG components, not image files). Left as-is deliberately: faking it locally
would make the card look better than the real render in claude.ai/design, which
would 404 the same paths. A real fix means hosting those two files with the design
system or inlining the mark as SVG.

## Target project (changed 2026-08-22)

Syncs to **"GD website & Dashboard"** (`d149a8c6-ae55-4d66-9e3f-525c4e1662fd`) — the
user's personal default design system, and the project the design agent reaches for
by default.

Before this run the config pinned **"Design System"** (`fd526e33-8a80-4872-8bea-9156a499d85b`,
the *org* default), which is where every earlier sync uploaded. That project still holds
a full but now-stale copy (100 components, missing the new home-page sections and still
carrying the five deleted ones). It is safe to delete once the new target is confirmed
good; nothing in this repo references it any more.

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
