# Gamma Developers — System Design

One design system for the public marketing site, the internal dashboard, the
client portal and the auth screens. Design lives in the browser here, not in
Figma. `app/globals.css`, `components/ui/` and `lib/admin-ui.ts` **are** the
design system; this file explains what is in them and which to reach for.

Feel: Linear (fast, quietly confident), Vercel (sharp type), Ramp (proof
everywhere), Anthropic (calm). Restrained. Never playful.

---

## 0. Rules for Claude Code — read before writing any UI

### 0.1 shadcn/ui is the only component source

**Every interactive control must come from `components/ui/`, which is
shadcn/ui.** Buttons, inputs, textareas, selects, dialogs, tabs, cards,
dropdowns, tooltips, toasts, calendars, switches, sheets, popovers,
accordions, avatars, badges, progress bars, separators, skeletons.

If the component you need is not in `components/ui/` yet:

```bash
npx shadcn@latest add <component>
```

That is the whole procedure. Install it from the official registry, then use
it.

**Never hand-roll a component that shadcn already ships.** Do not write your
own dialog, your own dropdown, your own checkbox, your own tabs, your own
toast. Do not copy shadcn source out of the docs into a new file by hand. Do
not approximate one with a `<div>`, a `<button>` and some state. The CLI
writes the file with the correct Radix primitive, the correct accessibility
wiring, the correct `data-slot` attributes and the correct `radix-nova` style
for this repo. A hand-written imitation gets the styling close and the
keyboard, focus management, portalling and ARIA wrong.

This holds even when the need looks trivial, even when the component would be
"just a few lines", and even when you are in a hurry.

### 0.2 The order to reach for things

1. **An existing primitive in `components/ui/`.** Check first, always.
2. **A repo wrapper around one** — `Modal`, `ConfirmAction`, `FormSelect`,
   `FormDatePicker`, `ProjectTabs`, `PortalTabs`. These exist so a screen does
   not restyle a primitive inline.
3. **`npx shadcn@latest add <component>`** if the official registry has it.
4. **A shared constant in `lib/admin-ui.ts`** for a non-control element that
   needs an existing skin (a panel, a row, a focus ring).
5. **Only then** hand-written markup — and only for layout, never for a
   control.

A one-off `className` on a screen that already has a shared constant or a
primitive is a regression.

### 0.3 Extend by variant, never by fork

When a primitive needs a different look, add a **variant** to its `cva`
definition. Do not create `button-admin.tsx` beside `button.tsx`, and do not
paste a wall of overrides at the call site.

The variants that exist today are in §5. `bare` (Button, Input, Textarea) and
`size="none"` (Button) contribute no classes, for a call site that fully owns
its own styling while still inheriting the primitive's base behaviour — focus
ring, disabled handling, svg sizing, `asChild`.

### 0.4 What is deliberately not installed

**`form`** — shadcn's Form is built on react-hook-form, which is not a
dependency here. All 27 form files use React 19 `useActionState` with server
actions that return form state. Installing it would fork the form pattern.
Never add it. See §9.

### 0.5 Standing constraints

- **No code comments** in `app/`, `components/`, `lib/`, `data/`, `hooks/`,
  `scripts/` or root config. Only functional directives survive:
  `eslint-disable*`, `@ts-expect-error`, `/// <reference>`, `prettier-ignore`.
  SQL migrations are the exception — they are an applied historical record.
- **No new hex.** Use a token from §2, a `lib/admin-ui.ts` constant, or a value
  that already exists in the repo. If a colour is load-bearing and recurring,
  give it a token rather than repeating the literal.
- **No filler text.** Clarity comes from labels, icons, spacing and hierarchy —
  never from added helper copy or tooltips-used-as-explanation.
- **No dead controls.** Remove a not-yet-working button; do not ship it
  disabled or greyed. Planned nav items go under a small "Planned" label.
- **No decorative backgrounds in `(admin)`.** Grid and dot patterns were
  deliberately deleted there.
- **Respect reduced motion.** Every GSAP effect is gated. See §7.
- **Verify.** `npm run check` and `npm run build` must pass. If you touched
  anything under `app/(admin)`, `app/(portal)` or `app/(auth)`, also run
  `npm run test:db` and `npm run test:api` — UI hiding is never a security
  control, and the role matrix is the proof.

---

## 1. The four surfaces

| Surface | Routes | Ground | Idiom |
|---|---|---|---|
| Marketing | `app/(marketing)` | Light `#f4f4ee` / `#eef0e9`, ambient green wash | Expressive. Big display type, aurora layers, GSAP reveals, shimmer labels. |
| Admin | `app/(admin)` | Light `#f8f8f3` panels on light ground; `#15181b` sidebar rail | Dense and flat. Linear's dashboard energy — speed and clarity over polish. |
| Portal | `app/(portal)` | Light, calmer than admin | Client-facing. Admin's restraint, marketing's warmth. Fewer controls, more status. |
| Auth | `app/(auth)` | **Dark** `#101214`, `#ecece4` headline, hairline white borders | The one dark surface. Split layout, green radial glows, masked grid overlay. |

These are deliberately distinct. Do not carry marketing decoration into admin,
or admin density into marketing. The dark idiom is Auth's alone — the grid
overlay that lives there is exactly what was deleted from admin. A visitor and
an owner never share a shell.

**Consistency means one set of primitives, tokens and motion scales — not one
visual idiom.**

### Marketing chrome

`app/(marketing)/layout.tsx` composes `ScrollProgress`, `SiteNav`, `StickyCta`
and `SiteFooter` for every marketing route. A marketing page renders only its
`<main>`. Never re-declare a header or footer in a page.

Marketing in-page links are root-relative (`/#work`, `/#process`) so they
resolve from any route, not just `/`.

---

## 2. Colour

All tokens live in the `@theme` block of `app/globals.css` and generate
Tailwind utilities. Use the utility, not the hex.

### Semantic — prefer these

`bg-background` `text-foreground` `bg-muted` `text-muted-foreground`
`border-border` `bg-input` `ring-ring` `bg-popover` `text-popover-foreground`
`bg-primary` `text-primary-foreground` `bg-secondary`
`text-secondary-foreground` `bg-accent` `text-accent-foreground`
`bg-destructive` `text-destructive`

### Brand

`bg-brand` / `text-brand` / `border-brand` / `ring-brand` → `#2FE85C`.

This is the accent — a 1.5–2px rail, a status dot, a glow, a hover edge. It is
never a large fill and never body text. Opacity variants work: `bg-brand/10`.

### Raw brand scale

| | Dark | Light |
|---|---|---|
| background | `gd-dark-background` `#16181c` | `gd-light-background` `#f4f4ee` |
| headline | `gd-dark-headline` `#ecece4` | `gd-light-headline` `#14171a` |
| muted | `gd-dark-muted` `#c5c8bd` | `gd-light-muted` `#4b5148` |
| emerald | `gd-dark-emerald` `#34d399` | `gd-light-emerald` `#059669` |
| accent | `gd-dark-mint` `#6ee7b7` | `gd-light-green-glow` `#10b981` |

### Working palette

The load-bearing values the app actually runs on:

| Token | Value | Role |
|---|---|---|
| `gd-green` | `#16a34a` | Interaction green — focus rings, input focus borders |
| `gd-green-edge` | `#0f7a37` | Solid-tone border and fill |
| `gd-green-deep` | `#08743d` | Owner accent, link ink |
| `gd-green-ink` | `#0b5f2c` | "ok" tone text |
| `gd-mint-bright` | `#69ee88` | Bright mint on dark panels |
| `gd-panel` | `#f8f8f3` | Admin panel ground |
| `gd-panel-dark` | `#15181b` | Dark rail and panel ground |

### Sidebar scale (admin rail only)

`bg-sidebar` `text-sidebar-foreground` `bg-sidebar-primary`
`text-sidebar-primary-foreground` `bg-sidebar-accent`
`text-sidebar-accent-foreground` `border-sidebar-border` `ring-sidebar-ring`

### Status tone

Never hand-roll a status colour. `lib/admin-ui.ts` exports
`Tone = "ok" | "warning" | "danger" | "info" | "muted"` with four maps:

| Map | Use |
|---|---|
| `TONE_SOFT` | Bordered chip |
| `TONE_SOLID` | Filled badge |
| `TONE_INK` | Text only |
| `TONE_FILL` | Bar or dot fill |

---

## 3. Typography

Three local faces, bound in `app/layout.tsx` via `next/font/local`.

- **`font-display`** → General Sans. Headings and big numbers. Always tight:
  `tracking-[-0.05em]` at `2rem`+, `-0.045em` at display sizes,
  `-0.025em`/`-0.02em` for mid-size headings.
- **`font-body`** / **`font-sans`** → General Sans. Body. Default `body`
  letter-spacing is `-0.006em`; leave it alone.
- **`font-mono`** → JetBrains Mono. **The signature element.** Every eyebrow,
  KPI label, stat and metadata line. Always uppercase, always positive
  tracking `0.14em`–`0.18em`, always small — `text-[9px]`, `text-[10px]`,
  `text-[10.5px]` — at `text-black/40` or dimmer.

`--font-syne` is a fourth face, deliberately reserved: bound in layout, exposed
through no Tailwind utility, used only by `.route-error-code` and
`.loader-word`. Do not reach for it anywhere else.

**Size scale** (arbitrary px, deliberately):
`9 · 10 · 10.5 · 11 · 11.5 · 12 · 12.5 · 13 · 15 · 17`, then `text-[2rem]` and
`text-3xl`/`text-5xl` for display. Admin runs on 11–13px. Marketing runs on
15px+ with display headings.

Numbers always get `tabular-nums`.

---

## 4. Radius and density

`rounded-lg` (controls, icon buttons) · `rounded-xl` (buttons, inputs, cards) ·
`rounded-2xl` (icon tiles) · `rounded-[20px]` / `rounded-[22px]` (panels, empty
states) · `rounded-full` (pills, dots, avatars).

Nothing sharp; nothing between these steps.

Icons are **lucide-react**, sized `size-3` / `size-3.5` / `size-4` in dense UI.

---

## 5. The component vocabulary

### 5.1 Installed primitives — `components/ui/`

shadcn/ui, style `radix-nova`, base colour `neutral`, CSS variables on.

`accordion` `avatar` `badge` `button` `calendar` `card` `dialog`
`dropdown-menu` `input` `label` `password-input` `popover` `progress` `select`
`separator` `sheet` `sidebar` `skeleton` `sonner` `switch` `tabs` `textarea`
`tooltip`

Plus their compound parts — `CardHeader`/`CardContent`/`CardFooter`/
`CardTitle`/`CardAction`/`CardDescription`, `DialogContent`/`DialogHeader`/…,
the full `Sidebar*` family and `useSidebar`.

`password-input` is a repo addition with no official equivalent: it composes
`Input` with a visibility toggle. See §5.3a — it is mandatory for every masked
field.

### 5.2 Button

Variants: `default` `outline` `secondary` `ghost` `destructive` `link`
`marketing` `admin-cta` `admin-primary` `admin-secondary` `admin-ghost`
`admin-danger` `admin-icon` `admin-icon-danger` `admin-dashed` `bare`

Sizes: `default` `xs` `sm` `lg` `icon` `icon-xs` `icon-sm` `icon-lg`
`marketing-sm` `marketing` `marketing-lg` `admin-xs` `admin-sm` `admin`
`admin-lg` `none`

**Pick the button by its job, not by eye.** These two rows are not
interchangeable — a create action on any admin screen is `admin-cta`, a
primary CTA on any marketing screen is `marketing`. Two screens showing the
same action must produce the same button.

| Job | Variant | Size | Icon |
|---|---|---|---|
| Create anything in admin — project, client, team member, contact | `admin-cta` + `data-button-fill` | `admin-lg` (`h-10`), or `h-9` nested in a panel | `Plus` `size-4` |
| Submit an admin form | `admin-cta` + `data-button-fill` | `admin-lg` | `Loader2` spinner while pending |
| Secondary admin action | `admin-secondary` | `admin` (`h-9`) | optional |
| Cancel / dismiss | `admin-ghost` | `admin` | none |
| Destructive admin action | `admin-danger` | `admin` | `Trash2` / `Archive` |
| Icon-only admin action | `admin-icon` / `admin-icon-danger` | — (variant sets `size-7`) | `size-3.5` |
| Marketing nav CTA | `marketing` + `data-button-fill` | `marketing-sm` (`h-10`) | none |
| Marketing section / form CTA | `marketing` + `data-button-fill` | `marketing` (`h-12`) | optional `ArrowRight` |
| Marketing hero CTA | `marketing` + `data-button-fill` | `marketing-lg` (`h-14`) | optional |

The `marketing` variant needs `data-button-fill` on the element and a
`<span className="button-fill-fx__label">` around the text — that is what the
cursor-origin fill animates. `admin-cta` is the same treatment in the admin
palette.

**Never set the fill colour with an arbitrary utility.** `[--button-fill-color:#2fe85c]`
looks correct and silently does nothing: `.button-fill-fx` is written unlayered
in `globals.css`, and unlayered CSS outranks everything in `@layer utilities`,
so the class's own `#232825` default always wins and the button fills grey.
Add a modifier class next to `.button-fill-fx` instead — that is what
`.button-fill-fx--brand` is. This applies to any unlayered global class in
`globals.css`, not just this one.

Heights come from the size scale. Do not type `h-11` or `h-13` onto a button.

The `admin-*` variants encode the `lib/admin-ui.ts` strings verbatim. Pair them
with `size="none"` so the variant's own padding stands rather than the default
size scale layering over it.

`bare` + `size="none"` contributes nothing — for a call site that fully owns
its styling but still wants the primitive's base behaviour.

Accepts `asChild` for composition and exports `buttonVariants`.

### 5.3 Input and Textarea

Variants: `default` (shadcn) · `admin` (the `INPUT` skin) · `admin-sm` (the
`INPUT_SMALL` skin) · `bare`

Admin screens use `variant="admin"`. Marketing screens that carry their own
field styling use `variant="bare"`.

### 5.3a PasswordInput — every masked field

`components/ui/password-input.tsx` is the only place a `type="password"` field
is built. Nothing else in the app may hand-roll an eye toggle; there is no
official shadcn equivalent, so this repo addition is the single source.

Props beyond `Input`'s:

| Prop | Use |
| --- | --- |
| `tone` | `light` (default) · `dark` for the sign-in and set-password panels |
| `toggleSize` | `default` (w-10) · `sm` (w-8) for dense rows |
| `visible` + `onVisibleChange` | Controlled reveal. Pass both when a list must show one row at a time |
| `revealNoun` | The noun in the label — "Show password", "Show value" |

Two things it guarantees that a hand-rolled toggle did not: the right padding
that reserves the toggle's gutter is merged **after** the caller's `className`,
so a caller's `px-*` cannot let text run under the icon; and the toggle is a
real `<button type="button">` with `aria-pressed` and a stated label.

Covers: admin login, set-password (team and client), profile → change password,
portal sign-in, and both ENV secret-value fields.

### 5.3b Dropdown menus

`components/ui/dropdown-menu.tsx` wraps the Radix primitives in the admin skin
and exports `DropdownMenu` `DropdownMenuTrigger` `DropdownMenuContent`
`DropdownMenuItem` `DropdownMenuLabel` `DropdownMenuSeparator`.

Row menus follow one shape, so a menu reads the same wherever it opens:

- **One word per item** — Edit, Copy, Share, Move, Rename, Source, Delete. Not
  "Edit URL", not "Move to group…", not "Share with a member…". The row the
  menu belongs to already says what the object is.
- **A lucide icon on every item**, `size-3.5`, in the item's order of use.
- **No label header and no separator.** The trigger is attached to the row, so
  a title repeating the row's own name is a second copy of information that is
  already on screen, and a rule inside a five-item menu divides nothing.
- **Destructive last**, `variant="destructive"`.

### 5.4 Badge

Variants: `default` `secondary` `destructive` `outline` `ghost` `link`.
Accepts `asChild`, exports `badgeVariants`.

### 5.5 Repo wrappers — use these before a bare primitive

| Wrapper | Path | Wraps |
|---|---|---|
| `Modal` / `ConfirmAction` | `components/admin/projects/modal.tsx` | `Dialog` |
| `FormSelect` | `components/common/form-select.tsx` | `Select` |
| `FormDatePicker` | `components/common/form-date-picker.tsx` | `Popover` + `Calendar` + `Button` |
| `ProjectTabs` | `components/admin/projects/project-tabs.tsx` | `Tabs` as route segments |
| `PortalTabs` | `components/portal/portal-tabs.tsx` | `Tabs` |
| `RouteNotice` | `components/admin/route-notice.tsx` | `sonner` toasts from `?notice=` |

### 5.6 Shared composition components

| Component | Path | Use |
|---|---|---|
| `SectionHeading` | `components/common/section-heading.tsx` | Mono eyebrow + brand dot + display title. The canonical marketing section opener. |
| `PageHeading` | `components/admin/page-heading.tsx` | Display title + optional action slot. The canonical admin page opener. |
| `EmptyState` | `components/admin/empty-state.tsx` | Dashed-border empty. Lucide icon, title, description, optional action. |
| `KpiCard` | `components/admin/kpi-card.tsx` | Stat tile. `tone`: `neutral \| warning \| danger \| money`. |
| `Reveal` | `components/common/reveal.tsx` | Scroll-in wrapper (fade + 26px rise, fires once). `delay`, `stagger`, `className`. |
| `AmbientField` | `components/common/ambient-field.tsx` | Orb wash. `variant`: `mint` (default) `\| blue \| violet \| warm`. **Marketing only.** |

### 5.7 `lib/admin-ui.ts` constants

`FOCUS_RING` `FOCUS_RING_DARK` `TEXT_BODY` `TEXT_META` `TEXT_QUIET`
`ICON_QUIET` `TEXT_DARK_BODY` `TEXT_DARK_META` `TEXT_DARK_QUIET`
`ICON_DARK_QUIET` `PANEL` `CARD_HOVER` `ROW_HOVER` `ICON_BUTTON`
`ICON_BUTTON_DANGER` `BUTTON_PRIMARY` `BUTTON_SECONDARY` `BUTTON_GHOST`
`BUTTON_DANGER` `INPUT` `INPUT_SMALL` `REVEAL_ON_HOVER` `DASHED_ACTION`
+ the four `TONE_*` maps.

The `BUTTON_*`, `ICON_BUTTON*`, `DASHED_ACTION`, `INPUT` and `INPUT_SMALL`
strings are also carried as primitive variants. **On a control, prefer the
variant.** Keep the constant for a non-control element that needs the same
skin. Compose with `cn()` from `@/lib/utils`.

### 5.8 Global classes — `app/globals.css`

| Class | Does |
|---|---|
| `.card-surface` | White card, two-layer shadow, deepens on hover |
| `.card-lift` | `translateY(-3px)` on hover — pair with `.card-surface` |
| `.panel-dark` | Flat `#15181b` panel (the admin rail) |
| `.edge-lit` | Brand-green hairline fades in along the top edge on hover/focus |
| `.reactive-tile` / `.terminal-glare` / `.nav-cta` | Diagonal sheen sweeps on hover |
| `.shimmer-label` | Animated gradient text for mono eyebrows |
| `.button-fill-fx` | Cursor-origin fill. Needs `data-button-fill` on the element; `ButtonFillEffects` in `app/layout.tsx` wires it globally |
| `.button-fill-fx--brand` | Fills brand green with ink text. **Use this, not an arbitrary `[--button-fill-color:…]`** — see below |
| `.button-fill-fx--nudge` | 2px hover rise + soft shadow. The standard lift |
| `.button-fill-fx--lift` | 4px rise + `scale(1.025)` + heavy glow. Reserve for hero-scale CTAs |
| `.button-fill-fx--soft` | Softer fill opacity |
| `.ambient-field` (+ `.ambient-grid`, `.ambient-orb`) | Use the `AmbientField` component, not the classes |
| `.marketing-container` / `.marketing-section` / `.marketing-primary-button` | Marketing layout and CTA skin |
| `.hero-*` / `.loader-*` / `.route-error-*` | Owned by their components; do not reuse |

---

### 5.9 Long lists scroll inside their panel

A list that grows without bound — an audit history, an activity feed — is
wrapped in `ScrollArea` rather than allowed to push the rest of the page down.
The panel keeps its place on screen and the list moves inside it.

The cap goes on the **viewport**, not the root: `viewportClassName="max-h-112"`.
Radix puts `overflow-y: scroll` on the viewport and shadcn sizes it `size-full`,
so a `max-h-*` on the root resolves to `height: auto` and the list overflows the
panel instead of scrolling. Give the root the gutter the scrollbar sits in
(`pr-2.5`) and let the viewport hold the height.

## 6. Feedback and notifications

**Toasts, not inline banners.** `<Toaster />` is mounted once in
`app/layout.tsx`. Raise one with `toast.success` / `toast.error` /
`toast.warning` / `toast.info` from `@/components/ui/sonner`.

Per-tone ink comes from `TONE_INK`, so a toast matches a status chip.

Server actions that redirect with an outcome append `?notice=<key>`;
`RouteNotice`, mounted once in `app/(admin)/layout.tsx`, reads the key, raises
the toast and strips the param so the URL is clean. Add a key to
`lib/projects/notices.ts` rather than rendering a banner.

Do not build a new inline notice strip, and do not hand-roll a dismiss timer.

---

## 7. Motion

Import from `@/lib/gsap` — never from `gsap` directly. It registers
`ScrollTrigger` and `useGSAP` and exports the shared scales:

- `ease.out` `power3.out` · `ease.inOut` `power2.inOut` · `ease.soft` `power1.out`
- `duration.fast` 0.35 · `duration.base` 0.8 · `duration.slow` 1.4

Gate every effect on `useReducedMotion()` from
`@/lib/hooks/use-reduced-motion` and bail early. `globals.css` also flattens
all animation under `prefers-reduced-motion` — belt and braces, keep both.

In JSX use the Tailwind utilities:

| Duration | Layer |
|---|---|
| `duration-150` | Dense controls |
| `duration-200` | Buttons, cards — the default |
| `duration-300` | Panels, marketing transitions |

Hand-written CSS in `globals.css` runs longer: `320ms` for card surfaces,
`650ms` for sheen sweeps.

Named animations live in the `@theme` block as `--animate-*` and are used as
utilities: `animate-scroll-hint`, plus the AI set — `animate-ai-sheen` (the
Ask AI pill's gradient sweep), `animate-ai-shimmer` (the same sweep at
generating speed, over `bg-clip-text`), `animate-ai-halo` (the assistant orb's
pulse) and `animate-ai-rise` (a panel entering). Reach for one of these before
writing a new keyframe.

Motion is restrained: a 0.5px hover lift, a rail scaling in, a sheen. Nothing
bounces.

---

## 8. Responsive

Same screens, working properly on a small screen — not a separate mobile
design.

**One table pattern, decided once:** a wide table is `hidden md:block`, and a
`md:hidden` card list carries the same rows below it. Both wide tables
(`app/(admin)/dashboard/page.tsx`, `components/admin/team/team-list.tsx`) use
`md`. Reuse it; do not pick a different breakpoint per screen.

Tab strips scroll horizontally on small screens rather than becoming cards.

---

## 9. Forms

The pattern is React 19 `useActionState` + a `"use server"` action that returns
form state. 27 files follow it. There is no react-hook-form and no shadcn
`Form`.

- Server reads live in `data/*.ts`, every file starting `import "server-only"`,
  readers wrapped in `cache()`.
- Mutations live in `app/(admin)/**/*-actions.ts`, marked `"use server"`,
  returning form state and calling `revalidatePath`.
- `<input type="hidden">` carrying ids into an action stays a raw `<input>`.
  So do file pickers, checkboxes, radios and range sliders until the matching
  shadcn primitive is installed for them.
- Validation and pure types live in `lib/projects/`, `lib/portal/`,
  `lib/credentials/`.

---

## 10. Verification gates

| Command | Checks |
|---|---|
| `npm run check` | eslint + `tsc --noEmit` |
| `npm run build` | Production build (webpack; Turbopack intentionally off) |
| `npm run test:db` | pgTAP policy tests, every role |
| `npm run test:api` | Direct Data API tests as owner, member, finance, client, anonymous |
| `npm run test:links` | Invite and portal link origins |
| `npm run release:check` | All of the above plus credential-key round trip |

`check` and `build` are required for any UI change. The two role suites are
required for anything touching `(admin)`, `(portal)` or `(auth)`.

---

## 11. Known gaps

Hand-rolled today, with an official shadcn component that should replace them
when the screens are next touched. Install with
`npx shadcn@latest add <name>` — do not write your own.

| Gap | Count | Install |
|---|---|---|
| Raw `type="checkbox"` | 13 across 9 files | `checkbox` |
| Raw `<table>` | 2 | `table` |
| Raw `type="radio"` | 2 | `radio-group` |
| Raw `type="range"` | 1 | `slider` |
| `ConfirmAction` on `Dialog` | 1 wrapper | `alert-dialog` |
| `SiteNav` services dropdown | 1 | `navigation-menu` |

Also open: 150 hex literals still used directly as utility colours, each a one-
or two-off with no shared meaning yet. Give one a token when it becomes
recurring and load-bearing — do not name a colour used once.
