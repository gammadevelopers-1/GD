---
name: gd-design
description: The Gamma Developers design system for this repo — brand tokens, typography, the four UI surfaces (marketing, admin, portal, auth), the shared class vocabulary, and the motion rules. Load this BEFORE writing or restyling any UI in gd-website: any component under components/, any page under app/(marketing), app/(admin), app/(portal), or app/(auth), and any change touching app/globals.css or lib/admin-ui.ts. Also load it when asked to "make this look right", match the brand, pick colors or spacing, or add animation.
---

# Gamma Developers design system

Design lives in the browser here, not in Figma. There is no separate design source of truth — `app/globals.css`, `components/ui/`, and `lib/admin-ui.ts` **are** the design system. Read them before styling; this file tells you what's in them and which one to reach for.

Feel: Linear (fast, quietly confident), Vercel (sharp type), Ramp (proof everywhere), Anthropic (calm). Restrained. Never playful.

## Hard rules

1. **No code comments.** Not explanatory, not "why", not section headers. Only functional directives survive: `eslint-disable*`, `@ts-expect-error`, `/// <reference>`, `prettier-ignore` (including JSX-wrapped `{/* eslint-disable-next-line */}`). Explain in chat, not in source.
2. **No filler text.** Clarity comes from labels, icons, spacing, and hierarchy — never from added helper copy, description paragraphs, or tooltips-used-as-explanation.
3. **No dead controls.** Remove a not-yet-working button; don't ship it disabled or greyed. Planned nav items go under a small "Planned" label.
4. **No decorative backgrounds in `(admin)`.** Grid and dot patterns were deliberately deleted there. Admin surfaces are flat. Ambient/aurora effects belong to `(marketing)`; grid overlays to `(auth)`.
5. **Reuse before you style.** A one-off `className` on a screen that already has a shared constant or primitive is a regression. Check `components/ui/` then `lib/admin-ui.ts` first.
6. **Respect reduced motion.** Every GSAP effect is gated (see Motion).

## The four surfaces

| Surface | Routes | Ground | Idiom |
|---|---|---|---|
| Marketing | `app/(marketing)` | Light `#f4f4ee` / `#eef0e9`, ambient green wash | Expressive. Big display type, aurora/ambient layers, GSAP reveals, shimmer labels. |
| Admin | `app/(admin)` | Light `#f8f8f3` panels on light ground; `#15181b` sidebar rail | Dense and flat. Linear's dashboard energy — speed and clarity over polish. |
| Portal | `app/(portal)` | Light, calmer than admin | Client-facing. Admin's restraint, marketing's warmth. Fewer controls, more status. |
| Auth | `app/(auth)` | **Dark** `#101214`, `#ecece4` headline, hairline white borders | The one dark surface. Split layout, green radial glows, a masked grid overlay, `clamp()` display type down to `leading-[0.88]`. |

Do not carry marketing decoration into admin, or admin density into marketing. The dark idiom is Auth's alone — the grid overlay that lives there is exactly what was deleted from admin.

## Color

Brand tokens are defined in the `@theme` block of `app/globals.css`. Use the Tailwind utilities they generate:

**Semantic (prefer these):** `bg-background` `text-foreground` `bg-muted` `text-muted-foreground` `border-border` `bg-input` `ring-ring` `bg-popover` `text-popover-foreground` `bg-primary` `text-primary-foreground` `bg-secondary` `text-secondary-foreground` `bg-accent` `text-accent-foreground` `bg-destructive` `text-destructive`

**Sidebar scale (admin rail only):** `bg-sidebar` `text-sidebar-foreground` `bg-sidebar-primary` `text-sidebar-primary-foreground` `bg-sidebar-accent` `text-sidebar-accent-foreground` `border-sidebar-border` `ring-sidebar-ring`

**Brand:** `bg-brand` / `text-brand` / `border-brand` → `#2FE85C`. This is the accent — a 1.5–2px rail, a status dot, a glow, a hover edge. It is never a large fill and never body text.

**Raw brand scale** (`gd-*` utilities, e.g. `bg-gd-dark-background`, `text-gd-light-muted`):

| | Dark | Light |
|---|---|---|
| background | `#16181c` | `#f4f4ee` |
| headline | `#ecece4` | `#14171a` |
| muted | `#c5c8bd` | `#4b5148` |
| emerald | `#34d399` | `#059669` |
| accent | mint `#6ee7b7` | glow `#10b981` |

**Honest caveat about arbitrary hex.** Admin and portal code carries a lot of raw arbitrary values — `#2fe85c` (128 uses), `#16a34a` (57), `#08743d` (44), `#15181b` (39), `#f8f8f3` (26), `#0b5f2c` (12). These are load-bearing and consistent; match them when extending an existing screen. For **new** work prefer the semantic token or the `lib/admin-ui.ts` constant that already encodes the hex. Never invent a new hex.

**Status tone** — never hand-roll status colors. `lib/admin-ui.ts` exports `Tone = "ok" | "warning" | "danger" | "info" | "muted"` with four maps: `TONE_SOFT` (bordered chip), `TONE_SOLID` (filled badge), `TONE_INK` (text only), `TONE_FILL` (bar/dot fill).

## Typography

Three local faces, bound in `app/layout.tsx` via `next/font/local` from `app/fonts/`:

- `font-display` → General Sans. Headings and big numbers. Always tight: `tracking-[-0.05em]` at `2rem`+, `-0.045em` at display sizes, `-0.025em`/`-0.02em` for mid-size headings.
- `font-body` / `font-sans` → General Sans. Body. Default `body` letter-spacing is `-0.006em`; leave it alone.
- `font-mono` → JetBrains Mono. **The signature element** (99 uses). Every eyebrow, KPI label, stat, and metadata line. Always uppercase, always positive tracking `0.14em`–`0.18em`, always small: `text-[9px]` `text-[10px]` `text-[10.5px]`, at `text-black/40` or dimmer.

`--font-syne` is a fourth face, deliberately reserved: it is bound in layout but exposed through no Tailwind utility, and only two classes use it — `.route-error-code` (the giant 404/500 numeral) and `.loader-word`. Don't reach for it anywhere else.

Real size scale (arbitrary px, deliberately): `9 · 10 · 10.5 · 11 · 11.5 · 12 · 12.5 · 13 · 15 · 17`, then `text-[2rem]` and `text-3xl`/`text-5xl` for display. Admin runs on 11–13px. Marketing runs on 15px+ with display headings.

Numbers always get `tabular-nums`.

## Radius

`rounded-lg` (controls, icon buttons) · `rounded-xl` (buttons, inputs, cards) · `rounded-2xl` (icon tiles) · `rounded-[20px]`/`rounded-[22px]` (panels, empty states) · `rounded-full` (pills, dots, avatars). Nothing sharp; nothing between these steps.

## What to build with

### 1. `components/ui/` — shadcn primitives, style `radix-nova`

`Accordion` `Badge` `Button` `Calendar` `Card` `Dialog` `DropdownMenu` `Input` `Popover` `Progress` `Select` `Separator` `Sheet` `Sidebar` `Skeleton` `Tabs` `Tooltip` (plus their compound parts — `CardHeader`/`CardContent`/`CardFooter`/`CardTitle`/`CardAction`/`CardDescription`, `DialogContent`/`DialogHeader`/…, the full `Sidebar*` family and `useSidebar`).

`Button` variants: `default` `outline` `secondary` `ghost` `destructive` `link`. Sizes: `xs` `sm` `default` `lg` `icon` `icon-xs` `icon-sm` `icon-lg`. `Badge` variants: `default` `secondary` `destructive` `outline` `ghost` `link`.

Both accept `asChild` for composition and expose `buttonVariants` / `badgeVariants`. These are the default for **new admin chrome**.

### 2. `lib/admin-ui.ts` — shared admin class constants

`FOCUS_RING` `FOCUS_RING_DARK` `PANEL` `CARD_HOVER` `ROW_HOVER` `ICON_BUTTON` `ICON_BUTTON_DANGER` `BUTTON_PRIMARY` `BUTTON_SECONDARY` `BUTTON_GHOST` `BUTTON_DANGER` `INPUT` `INPUT_SMALL` `REVEAL_ON_HOVER` `DASHED_ACTION` + the four `TONE_*` maps.

Reach for these when a shadcn primitive doesn't fit the density, or when matching an existing admin screen. Compose with `cn()` from `@/lib/utils`.

### 3. Global classes in `app/globals.css`

| Class | Does |
|---|---|
| `.card-surface` | White card, two-layer shadow, deepens on hover |
| `.card-lift` | `translateY(-3px)` on hover — pair with `.card-surface` |
| `.panel-dark` | Flat `#15181b` panel (the admin rail) |
| `.edge-lit` | Brand-green hairline fades in along the top edge on hover/focus |
| `.reactive-tile` / `.terminal-glare` / `.nav-cta` | Diagonal sheen sweeps across on hover |
| `.shimmer-label` | Animated gradient text for mono eyebrows (`.dark-heading` ancestor switches it to the dark palette) |
| `.button-fill-fx` | Cursor-origin fill; add `--soft` or `--lift`. Needs `data-button-fill` on the element — `ButtonFillEffects` in `app/layout.tsx` wires it globally |
| `.ambient-field` (+ `.ambient-grid`, `.ambient-orb`) | Drifting orb wash. Use the `AmbientField` component, not the classes. **Marketing only** |
| `.hero-*` / `.loader-*` / `.route-error-*` | Owned by their components; don't reuse elsewhere |

### 4. Shared components

`SectionHeading` (`components/common/section-heading.tsx`) — mono eyebrow with brand dot + display title. The canonical marketing section opener.
`PageHeading` (`components/admin/page-heading.tsx`) — display title + optional action slot. The canonical admin page opener.
`EmptyState` (`components/admin/empty-state.tsx`) — dashed-border empty. Takes a lucide icon, title, description, optional action.
`KpiCard` (`components/admin/kpi-card.tsx`) — stat tile with `tone` of `neutral | warning | danger | money`, trend delta, optional link.
`Reveal` (`components/common/reveal.tsx`) — scroll-in wrapper (fade + 26px rise on scroll, fires once). Props: `delay`, `stagger` (animates children in sequence), `className`.
`AmbientField` (`components/common/ambient-field.tsx`) — the orb wash. `variant`: `mint` (default) | `blue` | `violet` | `warm`.

Icons are **lucide-react**, sized `size-3` / `size-3.5` / `size-4` in dense UI.

## Motion

Import from `@/lib/gsap` — never from `gsap` directly. It registers `ScrollTrigger` and `useGSAP` and exports the shared scales:

- `ease.out` `power3.out` · `ease.inOut` `power2.inOut` · `ease.soft` `power1.out`
- `duration.fast` 0.35 · `duration.base` 0.8 · `duration.slow` 1.4

Gate every effect on `useReducedMotion()` from `@/lib/hooks/use-reduced-motion` and bail early. `globals.css` also flattens all animation under `prefers-reduced-motion` — belt and braces, keep both.

Timing splits by layer. In JSX use the Tailwind utilities — `duration-150` (dense controls), `duration-200` (buttons, cards — the default, 43 uses), `duration-300` (panels, marketing transitions). Hand-written CSS in `globals.css` runs longer: `320ms` for card surfaces, `650ms` for the sheen sweeps.

Motion is restrained: a 0.5px hover lift, a rail scaling in, a sheen. Nothing bounces.

## Idiomatic examples

Marketing section:

```tsx
<section className="border-border bg-secondary relative isolate overflow-hidden border-t">
  <AmbientField variant="mint" className="opacity-75" />
  <div className="relative z-1 mx-auto max-w-310 px-5 pt-22 md:px-9">
    <Reveal>
      <SectionHeading eyebrow="How we work" title="Ship where pilots die." />
    </Reveal>
  </div>
</section>
```

Admin panel:

```tsx
<div className={cn(PANEL, "p-5")}>
  <span className="font-mono text-[9px] tracking-[0.16em] text-black/40 uppercase">
    Active projects
  </span>
  <p className="font-display mt-3 text-[2rem] leading-none font-semibold tracking-[-0.05em] tabular-nums">
    12
  </p>
</div>
```

Status chip:

```tsx
<span className={cn("rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase", TONE_SOFT[tone])}>
  {label}
</span>
```

## Before you finish

- No new code comments.
- No new hex — a token, an `admin-ui` constant, or an existing value.
- Mono labels are uppercase, tracked, ≤10.5px, dimmed.
- Display headings carry negative tracking.
- Numbers are `tabular-nums`.
- Every GSAP effect checks `useReducedMotion()`.
- Nothing disabled-as-placeholder shipped.
- `npm run check` passes (eslint + tsc).
