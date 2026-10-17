# Gamma homepage — implementation brief

Paste this whole file into the Claude session that has `gammadevelopers-1/GD` open.

This brief is **self-contained**. It was written from a Claude Design handoff bundle
(`Gamma Homepage.dc.html` + style sheet + the design conversation) that you cannot see.
Everything you need — tokens, copy, layout, motion, states — is below. Don't go looking
for the design files; they aren't in your repo.

---

## 0. Before you write anything

1. **Read the existing codebase first.** Match its stack, routing, component conventions,
   styling approach and file layout. This brief specifies *what the page is*, not what
   your folder structure should be. If GD already has a Next.js app with its own
   patterns, follow those patterns.
2. **Work on a new branch.** The branch `marketing-rebuild` has uncommitted local work on
   it and has never been pushed — do not build on top of it without checking with the
   user first.
3. **Scope is one page**: the homepage, desktop 1440 and mobile 390, fully resolved.
   Twelve sections plus a sticky header. No other routes.

### Two open items — keep both exactly as specified

- **Testimonials:** no real client quote was ever supplied. The featured quote slot stays
  a labelled placeholder (spec in §8). Do **not** invent a quote, a name, or a company.
- **Fonts:** "Hikasami Sans" is not on any public font service. Declare it with a
  `local()` source and let **Archivo 700** stand in. Do not substitute a different
  display face.

---

## 1. What this page is selling, and to whom

Gamma is an AI automation agency. Public brand: **Gamma**. Legal entity:
**GammaDevelopers**. Site: gammadevelopers.ai.

They find where money is falling out of a business and plug it. The entry point is a free
AI Opportunity Audit; the end point is a custom platform plus a retained team.

**The reader** is an owner or ops lead at a 10–200 person business, GCC and US, across
industries — clinics, rental, logistics, recruiting, trades, e-commerce, professional
services. Time-poor. Already pitched by three agencies. Allergic to jargon. Not
technical. Thinks in money, time, headcount and "who's dropping the ball". Reading on a
phone, giving it about twenty seconds. They are the decision maker.

**The fact that shapes everything:** they are problem-aware but **not solution-aware**.
They know they're busy and something's off; they don't know it has a name. They cannot
search for what Gamma sells because they don't know it exists.

So the page never opens with the solution. Its first job is to **name the problem** so
they recognise themselves.

**Order, always: recognition → cost → fix.**

The recurring failure mode to avoid is a techy aesthetic and techy language aimed at a
non-technical owner. If a sentence only lands with a developer, it's wrong.

---

## 2. Hard rules — these are not preferences

Violating any of these means the work is wrong, not merely different.

- **NO gradients.** Not on text, buttons, or as background washes.
- **NO drop shadows.** Separate with a 1px border or a background-tone shift.
- **NO background patterns**, dot grids, circuit-board lines, floating shapes.
- **NO glowing orbs, neural meshes, hexagon networks, "AI brain" imagery, matrix rain,
  3D blobs.** The page must never look like an AI-generated template. This is the single
  most important rule.
- **NO exploding particles, no 3D money renders, no coins, no dollar signs.**
- **NO full-bleed green fields.** Green is an accent, never a surface.
- **NO stock photography.** No smiling people at cameras.
- **Pure black is never used.** `#14171A` and `#16181C` are the darks.
- **Heavy white space.** Generous section padding. Let it breathe.
- **ONE green accent element per viewport** — per screenful, not per page. The green is
  loud by design; that's why it appears once. Everything around it stays quiet.
- **On light surfaces green is MASS** — solid fills, 3px+ marks, chips, dots, icons at
  20px+. Never small text, never a thin line.

**Aesthetic target:** a premium consulting firm that happens to ship software. Expensive
through restraint and typography, not through effects. The register is Linear, Stripe,
Vercel, Ramp.

**This site IS the proof of what Gamma sells.** It must look like a design studio made it.

---

## 3. Design tokens

Ready to paste. This is Tailwind v4 CSS-first syntax; convert to your config format if
GD uses something else, but **do not change the values**.

```css
@theme {
  /* Light surfaces */
  --color-ground: #f4f4ee;        /* dominant surface */
  --color-surface: #ffffff;       /* cards, panels */

  /* Ink + text on light */
  --color-ink: #14171a;           /* headlines */
  --color-muted: #4b5148;         /* body */
  --color-dim: #7a7f76;           /* meta, eyebrows, source notes */
  --color-faint: #a8aca2;         /* falling marks, gap label */
  --color-marquee: #8a8f86;       /* wordmarks at rest */

  /* Hairlines on light */
  --color-line: #e1e2da;
  --color-line-soft: #e6e6de;     /* feed rows, skeletons */
  --color-line-strong: #c5c8bd;

  /* Green */
  --color-brand: #2fe85c;         /* fills, text on dark, marks */
  --color-brand-hover: #28d953;
  --color-display: #16a34a;       /* headline line 2 on light, display sizes only */
  --color-green-ink: #0d7728;     /* small green text + links on light */
  --color-green-tint: #d9f7e0;    /* initials circle */

  /* Dark sections — flat, no gradient, no glow */
  --color-dark: #16181c;
  --color-dark-row: #1c1f24;      /* row hover */
  --color-dark-line: #2a2d33;
  --color-dark-line-strong: #3a3e46;
  --color-dark-head: #ecece4;
  --color-dark-muted: #c5c8bd;

  /* Type */
  --font-display: "Hikasami Sans", var(--font-archivo), system-ui, sans-serif;
  --font-sans: "General Sans", system-ui, sans-serif;
  --font-mono: var(--font-jetbrains), ui-monospace, monospace;

  --breakpoint-nav: 760px;        /* header collapses its nav here */
}

@font-face {
  font-family: "Hikasami Sans";
  src: local("Hikasami Sans"), local("HikasamiSans");
  font-weight: 400 700;
  font-display: swap;
}
```

### Contrast — physics, not preference

| Combination | Ratio | Verdict |
|---|---|---|
| Green fill `#2FE85C` with `#14171A` text | 11:1 | the primary button |
| `#2FE85C` text on dark `#16181C` | 11:1 | use freely |
| `#2FE85C` text on light `#F4F4EE` | 1.5:1 | **NEVER** |
| `#2FE85C` hairline on light | 1.5:1 | **NEVER**, invisible |
| `#16A34A` large headline on light | ~3:1 | OK, display sizes only |
| `#0D7728` small text on light | 4.7:1 | OK |

### Fonts

- **Display — Hikasami Sans** (variable 400–700), Archivo 700 fallback. All headlines.
  Uppercase, 700, very tight tracking. This is the voice.
- **Body — General Sans.** Available from Fontshare:
  `https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600&display=swap`
- **Mono — JetBrains Mono.** Labels, stats and metadata **only**. Uppercase, 0.18em
  tracking, 10–11px, dimmed. Used sparingly — never an eyebrow above every heading.

Hikasami maxes at 700, so headline impact must come from **size and tight tracking**, not
extra weight. Numbers always tabular. Sentence case for sub-headings; uppercase for
display headlines only.

### Type scale — use only these steps

```css
.t-h1  { font-family: var(--font-display); font-weight: 700; font-size: clamp(44px, 7vw, 104px); letter-spacing: -0.05em;  line-height: 0.9;  text-transform: uppercase; }
.t-h2  { font-family: var(--font-display); font-weight: 700; font-size: clamp(34px, 4.4vw, 52px); letter-spacing: -0.045em; line-height: 0.95; text-transform: uppercase; }
.t-h3  { font-family: var(--font-display); font-weight: 600; font-size: clamp(20px, 2.4vw, 26px); letter-spacing: -0.035em; line-height: 1.25; }  /* sentence case */
.t-h4  { font-family: var(--font-display); font-weight: 700; font-size: 18px; letter-spacing: -0.025em; text-transform: uppercase; }
.t-lead{ font-size: clamp(16px, 1.4vw, 18px); line-height: 1.6; }   /* max 60ch */
.t-body{ font-size: 15px; line-height: 1.6; }
.t-meta{ font-size: 13px; }
.t-eyebrow { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.18em; text-transform: uppercase; }
.t-stat{ font-family: var(--font-display); font-weight: 700; font-size: clamp(44px, 5vw, 64px); letter-spacing: -0.05em; line-height: 0.9; font-variant-numeric: tabular-nums; }
```

### Spacing, radius, layout

- Content max width **1280px**, centred, page gutter **24px**.
- Section padding: `clamp(72px, 9vw, 128px)` vertical. Hero:
  `clamp(140px, 16vw, 200px)` top, `clamp(72px, 9vw, 120px)` bottom.
- Column gap on splits: `clamp(40px, 6vw, 96px)`.
- Rhythm: 8 inline · 16 card gaps · 24 gutter and row padding · 28–32 panel padding.
- Text max 60ch (leads often 52ch — noted per section).
- **Radius: 12 / 16 / 20 only.** 12 buttons and chips, 16 cards and large buttons,
  20 panels. Nothing sharp, nothing between these steps.

**Use container-driven grids, not media queries**, so sections reflow on their own:

```css
grid-template-columns: repeat(auto-fit, minmax(min(100%, 480px), 1fr));
```

Widths used: 480 (hero), 440 (feed / testimonials / final CTA), 380 (objections),
300 and 280 (tile grids), 200 (footer columns).

---

## 4. Theme rhythm

Light dominates; dark is for emphasis. **Never two dark sections adjacent.** Dark
sections are flat `#16181C` — no gradients, no glow — separated by hairlines.

| # | Section | Theme |
|---|---|---|
| 1 | Hero | LIGHT |
| 2 | Trust bar | LIGHT |
| 3 | The problem | LIGHT |
| 4 | Where it leaks | **DARK** |
| 5 | Watch it handled | LIGHT |
| 6 | How we work | LIGHT |
| 7 | What changes | **DARK** |
| 8 | Testimonials | LIGHT |
| 9 | Objections | LIGHT |
| 10 | Trust line | LIGHT |
| 11 | Final CTA | **DARK** |
| 12 | Footer | LIGHT |

---

## 5. Motion

One signature, quiet elsewhere.

| Element | Motion |
|---|---|
| Hero kinetic type | the signature, runs **once** on load, 800ms |
| Leak visual | slow continuous drift |
| Activity feed | slow continuous loop |
| Sections | fade + 20px rise on scroll, once, 300ms — **sparingly** |
| Cards / rows | border-tone shift on hover, 200ms |
| Buttons | subtle fill shift, 200ms |

200–400ms for interface response, up to 800ms for the hero. **Ease-out always** —
`cubic-bezier(.16, 1, .3, 1)`. No bounce, no elastic. No scroll-jacking, no pinned
sections, no parallax. Animation never blocks reading.

**Scroll-triggered fade-up on every section is the generic AI-site default — don't.**
In this build exactly one section reveals on scroll: §3, the four problem scenarios.

Every animated element ships a static `prefers-reduced-motion` state:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
}
```

### Keyframes

```css
@keyframes g-letter { from { opacity: 0; transform: translateY(0.16em) rotate(-3deg); } to { opacity: 1; transform: none; } }
@keyframes g-fall   { 0% { transform: translateY(0); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(150px); opacity: 0; } }
@keyframes g-rise   { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes g-marquee{ from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes g-pulse  { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.7; } }
```

---

## 6. Sticky header

Height 64px, `position: sticky`, `z-index: 50`. Give it `margin-bottom: -64px` so the
hero sits underneath and the header is genuinely transparent over it.

- **Transparent over the hero.** On scroll past 24px it gains the light ground
  (`#F4F4EE`) plus a 1px hairline (`#E1E2DA`). Transition both, 300ms ease-out.
- **Logo left:** GD wordmark, 24px, display font, `-0.05em`. **G** in `#2FE85C`,
  **D** in `#14171A`, with a 6px green dot absolutely positioned at the top-right of the
  D (`top: -3px; right: -7px`).
- **Nav centre:** Work · Services · Audit · About.
- **Right:** Contact link, then a green "Book a call" button — 36px tall, `0 16px`
  padding, radius 12, `#2FE85C` fill with `#14171A` text.
- **ALL nav text at 13px, one size, no exceptions.**
- **Below 760px:** hide the nav and the Contact link. Logo and the green button only.
  No hamburger, no drawer — that is deliberate, don't add one.

Anchor targets used across the page: `#top`, `#work`, `#services`, `#audit`, `#about`,
`#book`, `#contact`.

---

## 7. Sections

Copy below is **final and verbatim**. Type it exactly — including the `·` separators, the
curly apostrophes, and the ellipsis in objection 3. Do not rewrite, tighten, or
"improve" any line. See §8 for why.

### 1 — Hero (light)

Split: type left, visual right. Stacks on mobile with the visual below.

**Left column**, 28px gap:

- Eyebrow (mono, `#7A7F76`): `25+ businesses across the GCC and US`
- **H1, two-tone, `.t-h1`, `text-wrap: balance`:**
  - Line 1, `#14171A`: `Your revenue isn't missing.`
  - Line 2, `#16A34A`: `It's escaping.`
- Lead, max **52ch**, `#4B5148`:
  `It's going out through the gaps between your tools, your people, and the hours nobody's working.`
- Primary button → `#book`: 52px tall, `0 24px`, radius 16, `#2FE85C` fill,
  `#14171A` text, 15px/600 — `Book your AI audit`
- Under it, 13px `#7A7F76`: `Free · 30 minutes · you keep the findings either way`

**THE SIGNATURE ANIMATION — kinetic type.** Headline letters arrive slightly offset and
rotated, then settle into alignment. Runs **once** on load. 800ms, ease-out, no bounce.

Implementation that matters: split into per-letter spans and drive it from **CSS alone**,
staggering with a custom property — no JS, no client component, no effect hook:

```css
.hero-letter {
  display: inline-block;
  animation: g-letter 800ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: calc(var(--i) * 16ms);
}
```

Split on words first, wrap each word in `display:inline-block; white-space:nowrap` so
words never break mid-letter, then wrap each character. Increment `--i` across the whole
headline (line 2 continues line 1's count). Text must be readable before the animation
finishes. Under reduced motion the global rule kills the animation and the letters render
at their natural state — no extra handling needed.

**Accessibility:** put the full sentence on the `<h1>` as `aria-label` and mark the two
visual spans `aria-hidden`, so screen readers don't read it letter by letter.

**Right column — THE LEAK.** Height `clamp(300px, 32vw, 420px)`, `aria-hidden`.

Two labelled blocks joined by a horizontal line, with a gap between them. Value falls
through the gap — small marks drifting down and fading out.

```
      SALES ─────┐      ┌───── PROFIT
     revenue     ╎ gap  ╎      value
     generated   ╎      ╎      realized
                   ↓  ↓
                  ·  ·  ·
                    ·  ·
```

- A 1px `#C5C8BD` line across the full width at 50% height, sitting behind the blocks.
- Over it, a `2fr 1fr 2fr` grid, vertically centred.
- Left and right blocks: `#F4F4EE` background (opaque, to mask the line through them),
  1px `#C5C8BD` border, radius 16, padding `22px 20px`. Each has a mono label in
  `#14171A` (`Sales` / `Profit`) and a 13px `#7A7F76` two-line caption
  (`revenue / generated`, `value / realized`).
- Centre cell: a mono `gap` label in `#A8ACA2`, positioned 40px above centre.
- **Falling marks:** 7 absolutely positioned spans, 3px × 10px, radius 2,
  background `#A8ACA2`, `opacity: 0`, starting at `top: 50%`. Distribute horizontally
  across the gap with `left: calc(43% + ((i * 3.7) mod 13)%)`. Each runs `g-fall`
  linear infinite with duration `3800 + (i mod 3) * 500` ms and delay `i * 620` ms.

Slow, quiet, continuous. It must read as a **precise instrument, not an advert**. Thin
lines, small mono labels, muted marks. No explosions, no coins, no dollar signs.

### 2 — Trust bar (light)

Real client wordmarks in a slow marquee. Greyscale at rest, green on hover. Small and
quiet.

- Mono label above: `Teams we've built for` — label it honestly, never "Trusted by 500+".
- Track: `display:flex`, 56px gap, `width: max-content`,
  `animation: g-marquee 48s linear infinite`.
- Wordmarks in the display font, 18px/700, `-0.035em`, uppercase, `white-space: nowrap`.
  Rest colour `#8A8F86`, hover `#0D7728`, 200ms.
- Wrap in `overflow: hidden` with
  `mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)`.
- **Duplicate the full list twice** inside the track (the second copy `aria-hidden`) so
  the `-50%` translate loops seamlessly.

Order: `D360 Bank` · `Drive-247` · `Hiretics` · `Vidacure` · `METER` · `IFG` ·
`MCR Group` · `Cars BN` · `Royal Tap` · `Just Wills`

### 3 — The problem (light) — the mirror

Text-forward, generous space, minimal decoration. Should feel like someone read their
mind, not like a feature grid. Section has a `1px #E1E2DA` top border. Content column
max 800px.

- **H2:** `Any of this sound familiar?`
- Four scenarios. Each row: `1px #E1E2DA` top border, 24px top padding, then a flex row
  wrapping at `8px 32px` gap — a mono timestamp (`flex: 0 0 150px`, `#14171A`, 6px top
  padding) beside the sentence (`flex: 1 1 320px`, `.t-lead`, max 52ch,
  `text-wrap: pretty`).

| Timestamp | Sentence |
|---|---|
| `Friday, 7:04pm` | `A lead fills in the form. Everyone has gone home. By Monday they've already spoken to someone else.` |
| `Monday, 9:15am` | `Someone opens two systems side by side and retypes last week's bookings from one into the other.` |
| `Every quarter` | `Eight thousand contacts sit in the database. They cost money to collect. Nobody has emailed them since.` |
| `Friday, afternoon` | `The weekly report gets rebuilt by hand from four exports, to say roughly what it said last week.` |

- **Close on one line, `.t-h3`, `#14171A`, max 36ch:**
  `None of that is a people problem. Every one of those gaps sits between two job descriptions.`

**This is the one section that reveals on scroll.** Wrap the four scenarios (not the
heading, not the closing line) in an IntersectionObserver reveal at `threshold: 0.2` —
opacity 0 → 1 and `translateY(20px)` → 0, 300ms ease-out, fires **once**, then
disconnect. If reduced motion is set or IntersectionObserver is unavailable, render
revealed immediately.

**No solution here. No product names. Just recognition.**

### 4 — Where it leaks (DARK)

Background `#16181C`, body text `#C5C8BD`, 1px `#2A2D33` top and bottom borders.

- **H2** (`#ECECE4`, with line 2 in `#2FE85C`):
  `Five places the money goes.` / `None of them on a payslip.`
- Lead, max 56ch, `#C5C8BD`:
  `Each one starts with a sentence we hear on almost every first call.`

Five rows, hairline dividers, numbered 01–05 in mono. Each row is a link to `#services`.

Row layout: grid `48px minmax(0,1fr)`, gap `8px 20px`, padding `28px 12px 28px 0`,
1px `#2A2D33` bottom border, radius 12. The right cell is itself a
`repeat(auto-fit, minmax(min(100%,300px), 1fr))` grid with `12px 40px` gap: the label +
quote on the left, the arrow + explanation on the right.

- Number: mono 11px, `0.18em`, `#7A7F76`.
- Label: mono eyebrow, `#7A7F76`.
- Quote: `.t-h3` at `line-height: 1.2`, `#ECECE4`.
- Arrow: `→`, `#2FE85C`, 20px, `aria-hidden`.
- Explanation: 15px, max 48ch, `#C5C8BD`.
- **Hover:** background `#1C1F24`, `translateX(6px)`, text to `#ECECE4`, 200ms ease-out.
- **Focus-visible:** `2px solid #2FE85C`, offset 2px.

Each leads with the sentence the owner **actually says out loud**, then where the money
goes.

| # | Label | Quote | Where the money goes |
|---|---|---|---|
| 01 | Speed to lead | `"We get plenty of leads, they just don't convert."` | `Between form submit and first human contact. The lead didn't go cold. It went to whoever answered first.` |
| 02 | Document processing | `"Someone spends Monday retyping invoices into a sheet."` | `Salary spent on typing, plus late fees, missed discounts, and one person who can't take leave.` |
| 03 | Follow-up | `"We got 150 registrations and then… I don't know what happened."` | `Between 'showed interest' and 'written off'. The warmest list they own.` |
| 04 | Database reactivation | `"We've got 8,000 contacts in the CRM."` | `Between acquisition and abandonment. All paid for, all sitting there, while ad spend goes up.` |
| 05 | Internal reporting | `"Friday disappears into building the same report."` | `Senior people doing assembly work. This one leaks decision quality, not just hours.` |

### 5 — Watch it get handled (light)

This is where the page turns from problem to answer. Split at 440px.

**Left**, max 560px:

- **H2:** `Watch it get handled.`
- Lead, max 52ch:
  `Your systems stay. Your team doesn't learn a new tool. Nothing gets migrated. We add a layer that catches what falls through.`
- Body, 15px `#7A7F76`, max 52ch:
  `Routine work gets done the moment it arrives. Anything unclear goes to a person. Every action is written down.`

**Right — the panel.** White `#FFFFFF`, 1px `#E1E2DA` border, radius 20, padding
`24px 28px 8px`. **No shadow, no glow.**

- Header row, mono eyebrow `#7A7F76`, space-between: `Handled today` on the left, the
  count on the right.
- Body: fixed **340px** height, `overflow: hidden`, content pinned to the bottom
  (`justify-content: flex-end`), with
  `mask-image: linear-gradient(to bottom, transparent, #000 28%)` so old rows dissolve as
  they scroll off the top.
- Each row: grid `8px 1fr`, 14px gap, `16px 0` padding, 1px `#E6E6DE` top border.
  A **green dot** (8px, `#2FE85C`, 5px top margin), then a 13px mono label line in
  `#7A7F76` and a 15px plain-English result line in `#14171A`. Rows animate in with
  `g-rise`, 600ms.

Rows stream in from the bottom on a slow loop — **one new row every 2500ms**, keeping the
last **6**, seeded with the first **3** on mount. Calm and continuous: a heartbeat, not a
ticker. Skip the interval entirely under reduced motion.

| Label line (mono) | Result line (plain English) |
|---|---|
| `Lead · WhatsApp` | `routed to Sara · replied in 41s` |
| `Invoice · PDF` | `read · posted to accounts` |
| `Booking · web form` | `checked against calendar · confirmed` |
| `Enquiry · after hours` | `answered · flagged for morning` |
| `Quote request` | `priced · sent · follow-up scheduled` |

Must read as a **real product, not a graphic**. No glow, no connecting lines, no nodes,
no icons beyond the status dot.

**Three states — build all three** (the panel keeps its 340px height in each):

- **live** — count reads `{n} events`.
- **loading** — count reads `Connecting`. Three skeleton rows: a `#E1E2DA` dot plus two
  `#E6E6DE` bars (widths 38%/70%, 30%/58%, 44%/64%) pulsing with `g-pulse` 1.6s, stagger
  the delays (0/.2s, .3s/.5s, .6s/.8s). Below them, 13px `#7A7F76`:
  `Connecting to your systems…`. Mark the region `aria-busy="true"`.
- **empty** — count reads `0 events`. Centred, 1px `#E6E6DE` top border, an 18px display
  heading `Nothing handled yet` and 15px body, max 38ch:
  `Events appear here the moment the first system goes live in your stack. Until then, this stays quiet.`

Seed the live feed deterministically (first three events, in order) so server and client
markup match and hydration stays clean.

### 6 — How we work (light)

1px `#E1E2DA` top border.

- **H2:** `One leak first. Then the next.`
- Lead, max 56ch:
  `We start with one leak, prove the number, then expand. You see the cost before anything gets built and the result before anything else gets added.`

Three steps on a hairline rail, `auto-fit minmax(min(100%,280px), 1fr)`, gap `40px 32px`.
Each card: 1px `#C5C8BD` top border, 28px top padding, 18px gap.

- **Circular marker**, 44px, `border-radius: 50%`, mono 11px `0.1em`, `#14171A` text.
  Step 01 is filled `#2FE85C` with a matching border; steps 02 and 03 are transparent
  with a `#C5C8BD` border. *(This filled marker is the section's one green accent.)*
- Phase name `.t-h4` beside a mono week marker in `#7A7F76`, baseline-aligned, wrapping.
- Outcome, 15px, max 40ch.
- Two ticked points, 13px `#14171A`, each with a `✓` in `#0D7728` (`aria-hidden`).

| # | Phase | When | Outcome | Ticks |
|---|---|---|---|---|
| 01 | Audit | Week 1 | `We map how work actually flows today, every tool, handoff and bottleneck, and rank where the money is going.` | `Workflow map` · `Ranked leaks, with the cost` |
| 02 | Build | Weeks 2–6 | `We ship the first system into your real stack, wired to the tools you already pay for, with a person approving anything that matters.` | `Live in your stack` · `Your team reviews the exceptions` |
| 03 | Run | Ongoing | `We keep it running and improving, with every action logged and a retained team that keeps shipping.` | `Full audit trail` · `Retained team` |

Numbered markers are permitted **here only**, because this genuinely is a sequence.

### 7 — What changes (DARK)

Background `#16181C`, 1px `#2A2D33` top and bottom borders.

- **H2** (`#ECECE4`, line 2 `#2FE85C`): `What changes.` / `In hours, not adjectives.`
- Lead, max 56ch, `#C5C8BD`:
  `We don't promise conversion rates. We promise coverage, speed and hours returned, and we measure yours in the audit before quoting a number.`

**Three** stat tiles, `auto-fit minmax(min(100%,280px), 1fr)`, gap 16. Each: 1px
`#2A2D33` border, radius 16, padding 28, hover border `#3A3E46` at 200ms. Contents:
`.t-stat` number in `#2FE85C`; a 15px plain-language line in `#ECECE4`; a mono label; and
a **source note** — 10px, `#7A7F76`, above a 1px `#2A2D33` top border with 12px padding.

Three tiles, not four. Every number is arithmetic the reader can check, because **three
honest numbers beat six invented ones**. Frame outcomes as hours returned, response times
and coverage — things Gamma controls. **Never guaranteed conversion percentages.** Convert
hours into headcount, because that's a decision rather than an abstraction.

| Number | Line | Label | Source note |
|---|---|---|---|
| `33 hrs` | `Retyping 500 invoices a month, at four minutes each. About a fifth of a person, permanently, typing.` | `Document processing · per month` | `Arithmetic: 500 × 4 min ÷ 60. Your volume and your timing get measured in week one; the number is yours, not ours.` |
| `208 hrs` | `One senior person, four hours every Friday, rebuilding the same report. That is five working weeks a year.` | `Internal reporting · per year` | `Arithmetic: 4 hrs × 52 weeks. We time the current build during the audit before quoting a saving.` |
| `24 / 7` | `The Friday 7:04pm form gets a reply at 7:04pm. Anything unclear waits for a person in the morning.` | `Speed to lead · coverage` | `Coverage is what we control, so it is what we promise. Every reply is logged with a timestamp you can check.` |

### 8 — Testimonials (light)

Split at 440px, items aligned to the start.

**Left — the featured slot.** Mono eyebrow: `From the people who run it`.

**No real quote was supplied, so this stays an explicit placeholder.** Render a
`<blockquote>` at `.t-h3`, max 30ch, radius 16, 1px `#E1E2DA` border, 28px padding, with a
striped fill that reads unmistakably as a placeholder:

```css
background: repeating-linear-gradient(135deg, #ECECE4 0 8px, #F4F4EE 8px 16px);
```

Inside it, in mono 11px `#4B5148` at `line-height: 1.8`:
`Featured quote · real words from a real client, verbatim. Drop the quote here once approved; nothing on this page is invented.`

Below: a 44px `#D9F7E0` circle with `#0D7728` display-font initials reading `··`, beside
a 15px/600 `#14171A` `Name` and a 13px `#7A7F76` `Role, Company`.

**Do not invent a quote to fill this.** When a real one arrives it replaces the striped
block and the initials, name and role become real. No stock photos — initials in a
green-tinted circle, always.

**Right — the client list.** 1px `#E1E2DA` top border; each row `18px 0` padding, 1px
`#E1E2DA` bottom border, space-between, 15px. Name in `#14171A`/500, descriptor in
`#7A7F76`, right-aligned.

| Name | Descriptor |
|---|---|
| `D360 Bank` | `Saudi Arabia's first digital bank` |
| `Drive-247` | `Rental SaaS, US` |
| `Hiretics` | `AI hiring` |
| `Vidacure` | `HealthTech, Sweden · HIPAA / GDPR` |
| `METER` | `Energy` |
| `IFG` | `AI CRM` |
| `MCR Group` | `Salon and skin clinic` |

### 9 — Objections (light)

1px `#E1E2DA` top border. Split at 380px, aligned to the start.

**Left — the accordion.** H2: `The questions you're already asking.`

One item open at a time; **the first item starts open**. Clicking the open item closes it.
Each item sits on a 1px `#E1E2DA` bottom border with a full-width `<button>`: 17px/500
body font, `#14171A`, `20px 4px` padding, space-between, hover `#0D7728`. On the right a
glyph — `–` when open, `+` when closed — at 22px `#7A7F76`, `aria-hidden`, in a fixed 24px
centred box so it doesn't shift. Set `aria-expanded` on the button. The answer is 15px,
max 56ch, `#4B5148`, padding `0 4px 24px`, animating in with `g-rise` 300ms.
Focus-visible: `2px solid #14171A`, offset -2px.

| Question | Answer |
|---|---|
| `"We tried automation and it broke."` | `What broke is usually that nothing handled the exceptions and nobody owned it after launch. Both are design failures, not automation failures.` |
| `"My business is too unique for this."` | `The judgment is unique. The typing isn't.` |
| `"We don't have the data."` | `Then the first engagement is finding out what you have. That's a deliverable, not a blocker.` |
| `"My team will resist it."` | `People resist being replaced. They don't resist losing the task they complain about every week.` |
| `"What if it makes a mistake?"` | `It will. So does the manual process, you just don't measure that one. The question is what happens when it isn't sure, and the answer is that a person sees it.` |
| `"Can't we just use ChatGPT?"` | `For one document, yes. The work is document two hundred, at 2am, in a format nobody expected.` |
| `"This sounds expensive."` | `Compared to what? Most of this was going to be fixed by hiring someone. Run it against that salary, not a software subscription.` |

**Right — the trust move.** A sticky `<aside>` (`top: 96px`), max 440px, `#FFFFFF`,
1px `#E1E2DA` border, radius 20, 32px padding:

- Mono eyebrow: `What we won't do`
- `.t-h3` at `line-height: 1.3`:
  `We don't automate judgment calls, anything that needs a relationship, or a process nobody can explain out loud yet.`
- 15px body:
  `If the audit finds your leak is one of those, we'll say so and you keep the map.`

**This panel is the trust move. Keep it.** Naming a real limit is the point.

### 10 — Trust line (light)

One honest line. Padding `clamp(48px, 6vw, 80px)`, 1px `#E1E2DA` top border, `.t-lead`,
`#4B5148`, inside the 1280px container.

`We've shipped under HIPAA, GDPR and WCAG. Your data stays in your systems, and every action is logged.`

**No certification badges. No compliance logos. No "request a trust report".**

### 11 — Final CTA (DARK)

`#16181C`, padding `clamp(80px, 10vw, 144px)`, 1px `#2A2D33` top and bottom borders.
Split at 440px, `align-items: end`.

**Left — H2** at `clamp(40px, 6vw, 88px)` / `-0.05em` / `0.9`, uppercase, `text-wrap: balance`:
`Thirty minutes.` (`#ECECE4`) / `You keep the findings.` (`#2FE85C`)

**Right**, max 480px. Three numbered lines, each with a 1px `#2A2D33` top border, 12px top
padding, a mono `01`/`02`/`03` in `#7A7F76`, and 15px `#C5C8BD` text:

1. `You talk us through how work moves today. No prep, no slides.`
2. `We name the two or three places money is falling through, and what each one costs a year.`
3. `You get the written findings whether or not we ever speak again. No pitch.`

Then the green button (52px, radius 16, `#2FE85C`/`#14171A`) → `#contact`:
`Book your AI audit`, with 13px `#7A7F76` beneath: `Free · 30 minutes · GCC and US hours`

Focus-visible on dark: `2px solid #2FE85C`, offset 3px.

### 12 — Footer (light)

`id="contact"`, padding `clamp(56px, 7vw, 96px) 24px 40px`, 56px gap. Columns on
`auto-fit minmax(min(100%,200px), 1fr)`, gap `40px 32px`.

**Column 1:** the GD wordmark again (same construction as the header), then 13px
`#4B5148`, max 28ch: `Gamma finds where money is falling out of a business and plugs it.`
Then a mono eyebrow: `Built in Pakistan` — honest and differentiating.

**Column 2 — `Company`:** Work · Services · Audit · About
**Column 3 — `Services`:** Speed to lead · Document processing · Follow-up ·
Database reactivation · Internal reporting (all → `#services`)
**Column 4 — `Contact`:** `gammadevelopers.ai` (→ `https://gammadevelopers.ai`),
`Book your AI audit` (→ `#book`), and plain text `GCC and US hours`

Column headings are mono eyebrows in `#7A7F76`; links are 13px `#14171A` hovering to
`#0D7728`.

**Bottom bar:** 1px `#E1E2DA` top border, 20px padding, space-between, 13px `#7A7F76`:
`© 2026 GammaDevelopers` and `Gamma is the public brand of GammaDevelopers.`

**No fake status indicators** — no "all systems operational" dot.

---

## 8. Voice — enforce in every line

The copy in §7 is final. It was written against these rules; rewriting a line almost
certainly breaks one.

Tone: confident, plain, specific. A senior operator talking, not a marketer selling.
Premium but warm, never cold or techy.

**Banned:** revolutionize · game-changer · 10x · unlock · seamless · cutting-edge ·
"AI-powered" as an adjective · transform your business · leverage · synergy · empower ·
supercharge · "in today's fast-paced world". **No em dashes in headlines.**

**Never name a tool in owner-facing copy** — it invites "we already have X" and turns a
value conversation into a procurement conversation.

| Don't say | Say |
|---|---|
| Workflow automation | Nobody has to do that step anymore |
| Integration | The two systems stop needing a person between |
| Webhook / trigger | It happens the moment the form is submitted |
| Human-in-the-loop | Your team reviews the exceptions, not routine |
| Data pipeline | The numbers arrive already compiled |
| AI agent | It reads it, pulls out what matters, flags what's unclear |
| Deduplication | Nobody gets contacted twice |
| Orchestration layer | A layer on top of what you already use |
| Reduce overhead | Give someone their Friday back |
| Scalable | It costs the same at 500 invoices as at 200 |

**Say often:** Your systems stay. Your team doesn't learn a new tool. We start with one
leak, prove the number, then expand. Humans stay where judgment matters.

**Never say:** "Replace your team." "Fully autonomous." "Set and forget." Guaranteed
conversion percentages. 100% accuracy. Anything implying their current setup is stupid —
it was rational when it was built.

**Stat integrity:** if you can't name the study, year and sample, don't publish the
number. When in doubt replace the statistic with arithmetic — arithmetic can't be
debunked, and it's more persuasive anyway. That's why §7's tiles are arithmetic.

**CTAs say what happens** — "Book your AI audit", never "Get started".

---

## 9. Buttons and states

Build all four states.

| State | Spec |
|---|---|
| Default | `#2FE85C` fill, `#14171A` text, 15px/600, 52px tall, `0 24px`, radius 16 |
| Hover | fill → `#28D953`, 200ms ease-out |
| Focus | `outline: 2px solid #14171A; outline-offset: 3px` on light — `#2FE85C` on dark |
| Disabled | `#E1E2DA` fill, `#7A7F76` text, `cursor: not-allowed` (on dark: `#2A2D33` fill) |

Header variant: 36px tall, `0 16px`, radius 12, 13px.
Secondary on dark: transparent with a 1px `#3A3E46` border, `#ECECE4` text, 500 weight.

Use **`:focus-visible`**, not `:focus`, so the ring appears for keyboard users without
firing on mouse clicks. Keyboard focus must be visible on every interactive element.

---

## 10. Component boundaries

Keep the client bundle small. Only three things need interactivity — everything else
renders on the server.

| Needs `"use client"` | Why |
|---|---|
| Header | scroll listener toggling the background and hairline |
| Activity feed | 2500ms interval pushing rows |
| Objections accordion | open/closed state |
| Problem reveal wrapper | IntersectionObserver, fires once |

Server-rendered, no JS at all: hero (including the kinetic type — it's pure CSS), leak
diagram, trust bar, where-it-leaks, how-we-work, what-changes, testimonials, trust line,
final CTA, footer.

Put **all copy in one typed module** (e.g. `lib/gamma-content.ts`) rather than inline in
JSX. This page is copy-heavy and copy-sensitive; edits should never mean hunting through
markup.

Attach the scroll listener as `{ passive: true }`, and clean up the listener, the
observer and the interval on unmount.

---

## 11. Pre-ship check — run this on every section

- [ ] Does it open with a symptom the reader recognises, not a solution?
- [ ] Would a 30-person business see themselves, or does it read like it's built for a corporation?
- [ ] Can the reader find cost and timeline without filling in a form?
- [ ] Is there exactly **ONE** green accent element in this viewport?
- [ ] On light sections, is green a fill or a thick mark — never small text, never a hairline?
- [ ] Would an owner with no technical background understand every word?
- [ ] Is every number sourced or measured?
- [ ] Is every logo, name and quote real? (The testimonial placeholder stays a placeholder.)
- [ ] Does it work at **375px**?
- [ ] Does it degrade gracefully with `prefers-reduced-motion`?
- [ ] Is keyboard focus visible? Is contrast AA on both light and dark?
- [ ] Have we removed one thing? If nothing has been cut, cut something.

Verify at **1440** and **390** before calling it done, and check 375 for overflow.
