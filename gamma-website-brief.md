# Gamma — Website Build Brief

**For:** Claude Code (and any dev/designer touching gammadevelopers.ai)
**Purpose:** everything you need to build the marketing site — positioning, voice, visual system, motion rules, page-by-page specs.
**Rule:** if a design or copy decision conflicts with this file, this file wins. If this file is silent on something, ask before inventing.

---

## 0. How to use this file

1. Read §1–§7 before writing a single line of code. That's the positioning and the system.
2. Build pages from §8 in the listed order.
3. Before shipping any section, run it against the checklist in §14.
4. Never invent claims, logos, certifications, or testimonials. See §12 — this is the one hard rule.

---

## 1. The company in one paragraph

Gamma is an AI-first software engineering agency. We build bespoke, AI-automated systems for small and mid-sized businesses in the GCC and US. Not a product, not a template — every platform we build is an automation engine wired into how the client already works. The entry point is an **AI Opportunity Audit**; the endpoint is a full custom platform plus a retained team. Public brand name: **Gamma**. Legal entity: GammaDevelopers.

**Proof we have:** 25+ businesses transformed. Real named work includes D360 Bank (Saudi Arabia's first digital bank), Drive-247 (multi-tenant rental SaaS, US market), Hiretics (AI hiring, AWS serverless), Vidacure (Swedish HealthTech, HIPAA/GDPR), METER (energy SaaS), IFG (AI-powered CRM), Cars BN, Royal Tap, Just Wills.

---

## 2. Who we're talking to — SMEs, directly

**We sell to small and mid-sized businesses. Not enterprise.** Every design and copy decision on this site is made for that reader. When something on the page would only make sense to a 5,000-person company, it's wrong for us.

**The reader:**
- Owner, founder, or the one ops person who runs everything. 10–200 staff.
- GCC or US. Rental companies, clinics, agencies, logistics, trades, recruiting, e-commerce, professional services.
- **They are the decision maker.** There is no procurement department, no security questionnaire, no six-month evaluation. They decide on a call.
- Time-poor. Reading the site on a phone, between two other things.
- Has been pitched by agencies before and is braced for it.
- Not technical. Doesn't know what a webhook is, doesn't care what model we use, will not read a stack list.
- Thinks in four currencies: **money, time, headcount, and who's dropping the ball.**

**What this means for the site — the SME rules:**

1. **No enterprise theatre.** No "request a trust report," no compliance badge wall, no "enterprise-grade," no procurement language. An SME owner has never once asked a vendor for a SOC 2 report. Showing that stuff signals "expensive and slow," which is the exact objection we're fighting.
2. **Price has to appear somewhere.** SMEs bounce off "contact us for pricing" because they read it as "too expensive to publish." At minimum, state what the audit costs and a starting-from figure for a build. See §8.4.
3. **The reader must see themselves in the proof.** A Saudi digital bank is impressive but it makes a 30-person clinic think *"they're too big for me."* Lead the work section with SME-sized clients; keep the big names as a credibility line, not the hero.
4. **Timeline in weeks, not quarters.** SMEs need to feel the payback inside a quarter. "First agent live in week 6" is the kind of number that closes.
5. **Faces, not a firm.** For a small business buying from a Lahore team, "who will actually answer my email" beats every capability claim. Real photos, real names.
6. **The comparator is a salary, not software.** Almost every leak on this site is currently on the roadmap to be fixed by *hiring someone*. Price and framing anchor against that hire, never against a SaaS subscription.

**Secondary reader:** a technical person the owner forwards the site to. They need enough substance to say "these people are real." They are not the primary audience — never design the homepage for them. Give them a depth layer (case studies, expandable technical detail) instead of cluttering the main path.

**Who we're not for:** enterprise procurement cycles, startups looking for a cheap MVP, anyone shopping on hourly rate, one-off landing page work.

---

### 2.1 How an SME actually buys — design the site around this

```
Sees a post / gets an outreach message
  → lands on the site on a phone, gives it ~20 seconds
  → "do these people understand my business?"          ← §8.1 ③ decides this
  → "what does it cost and how long?"                  ← must be answerable without a call
  → "have they done this for someone like me?"         ← §8.1 ⑦ decides this
  → books a call
  → decides on call 1 or 2
```

There is no fifth step. No pilot committee, no legal review, no RFP. The whole site exists to move someone from "that's us" to a booked call in under two minutes.

Two consequences for the build:
- **Every page must answer cost and timeline** without requiring a form.
- **Nothing gated.** No email wall on the audit tool or calculator. The tool *is* the marketing.

---

## 3. Positioning — the one idea everything ladders to

> **Most businesses don't have a growth problem. They have a leak problem.**
> The revenue was already paid for. It's leaking out of the gaps between the tools, the people, and the hours nobody's working.

Three supporting pillars — every page should express at least one:

**1. Leaks are invisible because nobody owns them.**
Every leak sits *between* two people's job descriptions. Marketing's job ends when the form submits. Sales' job starts when the lead is assigned. The gap between those two moments is where money dies and nobody's KPI covers it.

**2. We're an overlay, not a replacement.**
The most important line on the entire site. Owners have been burned by "let's migrate everything" projects. Our promise: *your team keeps working exactly how they work today. We add a layer that catches what falls through.* Nothing gets ripped out. Nothing gets re-learned.

**3. The business already paid for what it's losing.**
The lead cost ad spend. The retyping costs salary. The dormant list cost money to build. This isn't new spend for new results — it's recovering spend already made. That reframe is what makes the price feel small.

**The flywheel to close pages with:** plug the leak → hours come back → the team serves clients better → clients stay and refer → more volume → more leaks worth plugging.

### What we sell, in owner language

| We build | Never say | Say |
|---|---|---|
| Speed to lead | "Lead routing automation" | "The lead that comes in at 7pm Friday gets answered at 7pm Friday" |
| Document processing | "OCR + extraction pipeline" | "Nobody retypes invoices into the spreadsheet anymore" |
| Follow-up systems | "Drip sequences" | "The 90 people who registered and didn't show up still hear from you" |
| Database reactivation | "CRM re-engagement campaigns" | "Your best month is probably already sitting in your CRM" |
| Internal reporting | "BI dashboards / data pipeline" | "Friday's report builds itself" |
| Custom platforms | "Multi-tenant SaaS architecture" | "One system instead of the five tools you're paying for" |

---

## 4. Voice and copy rules

**Tone:** confident, plain, specific. A senior operator talking, not a marketer selling. Premium but warm — never cold or "techy."

### Hard rules

- **Open with the symptom, never the solution.** Recognition → cost → mechanism. Always that order.
- **Concrete beats clever.** "200 invoices, 15 minutes each — that's a third of a person" beats "significant efficiency gains."
- **One idea per section.**
- **Never name a tool in owner-facing copy.** Tool names invite "we already have X" and turn a value conversation into a procurement conversation. Tools can appear on deep technical pages only.
- **No em dashes in headlines.** (Use them sparingly in body copy.)
- **Sentence case for headings.** Not Title Case, not ALL CAPS.
- **Say what automation can't do somewhere on the site.** Trust is the moat.
- **CTAs say what happens.** "Book the audit" not "Get started." "See the workflow" not "Learn more."

### Banned vocabulary

revolutionize · game-changer · 10x · unlock · seamless · cutting-edge · transform your business · leverage · empower · supercharge · "AI-powered" as an adjective · "in today's fast-paced world" · "we're passionate about"

### Technical → owner translation (use this table when writing any copy)

| Don't say | Say |
|---|---|
| Workflow automation | Nobody has to do that step anymore |
| Integration | The two systems stop needing a person in between |
| Webhook / trigger | It happens the moment the form is submitted |
| Human-in-the-loop | Your team reviews the exceptions, not the routine |
| Data pipeline | The numbers arrive already compiled |
| AI agent | It reads it, pulls out what matters, flags what's unclear |
| Deduplication | Nobody gets contacted twice |
| Orchestration layer | A layer on top of what you already use |
| Reduce operational overhead | Give someone their Friday back |
| Scalable | It costs the same at 500 invoices as at 200 |

### Copy patterns that work on this audience

1. **The mirror** — describe a Tuesday in their business in uncomfortable detail, then stop.
2. **The arithmetic** — one leak, one calculation, real numbers, one line of implication.
3. **The self-test** — something checkable in 60 seconds ("fill in your own contact form at 7pm, time the reply").
4. **The reframe** — "You don't have a lead problem. You have a response-time problem."
5. **The teardown** — anonymised before/after, hours before, hours after, and *what a human still does*. That last part is the credibility.

---

## 5. Visual identity

### Theme model — read this carefully

**This is not a light/dark toggle site.** There is no theme switcher. The site is **predominantly light**, with **specific sections rendered in dark** as deliberate punctuation. Dark sections mark a change in register — proof, depth, or weight.

Rhythm: light → light → **dark** → light → light → **dark** → light. Roughly one dark block every 2–3 light sections. Never two dark sections back to back.

Sections that earn dark treatment: the process/how-we-work block, the stats/outcomes block, and the final CTA. Everything else stays light.

Reference for this exact pattern: **Stripe** and **Linear** — mostly light marketing pages with dark full-bleed sections used as chapter breaks, not decoration.

### Color tokens

**One green across the whole site.** `#2FE85C` is the accent in light sections *and* dark sections. There is no "light-mode emerald" and no muted alternative — a duller green in light sections would split the brand into two identities and kill the recognition the bright green buys us.

```
/* THE GREEN — same value everywhere */
--gamma-green:       #2FE85C;   /* logo G, signature dot, buttons, accents, both themes */
--green-ink:         #0D7728;   /* SAME hue, darkened. ONE job only — see rule below */

/* LIGHT (default, ~75% of the site) */
--bg-light:          #f4f4ee;   /* off-white page background */
--surface-light:     #ffffff;   /* cards, panels */
--text-light:        #14171a;   /* headlines */
--muted-light:       #4b5148;   /* body, secondary */

/* DARK (punctuation sections only) */
--bg-dark:           #16181c;   /* charcoal */
--backdrop-dark:     #0a0b0c;   /* deepest layer, nested panels */
--text-dark:         #ecece4;   /* off-white headlines */
--muted-dark:        #c5c8bd;   /* body */
--highlight-dark:    #6ee7b7;   /* mint, glow only, very sparing */
```

**How `#2FE85C` behaves on each background — this is physics, not preference:**

| Placement | Contrast | Verdict |
|---|---|---|
| Green **fill** with `#14171a` text on top | 11:1 | Perfect. This is the default button on light sections. |
| Green text/strokes on dark `#16181c` | 11:1 | Perfect. Use freely in dark sections. |
| Green **text** on light `#f4f4ee` | **1.5:1** | Unreadable. Never do this. |
| Green 1px hairlines/borders on light | 1.5:1 | Invisible. Never do this. |

**So on light sections the green shows up as mass, not as ink:**
- Solid button fills, with `#14171a` text sitting on them (not white text)
- Chips, badges, and filled blocks
- The signature dot, logo mark, and graphic shapes
- Thick underlines and highlight bars (3px+), never hairlines
- The line-field visualisation, chart strokes, and data marks at 2px+
- Icon fills at 20px+

`--green-ink` (`#0D7728`) exists for exactly one job: **small green text and inline links on light backgrounds**, where the bright green would be unreadable. It's the same hue, just darkened to clear AA at 4.7:1. Do not use it for buttons, shapes, or anything the bright green can do.

Reference for this exact pattern: **Spotify** uses `#1DB954` as a solid fill with black text on it and never as body text; **Supabase** does the same with `#3ECF8E`; **Duolingo** runs a bright green on white the same way. All three keep one green and change its *role*, not its value.

**Brand restraint rules — non-negotiable:**

- **One green accent element per viewport.** Not per page — per screenful. This matters even more now that the green is bright in both themes: two bright green things on one screen fight each other and the page stops feeling premium.
- The green is loud by design. That's the reason it appears once. Everything around it stays quiet.
- Heavy white space. Generous section padding. Let things breathe.
- **No gradients.** No gradient text, no gradient buttons, no gradient washes as decoration.
- **No drop shadows.** Use a 1px border or a background-tone shift for separation instead.
- Pure black is never used. `#14171a` and `#16181c` are the darks.
- Never a full-bleed green field. Green is an accent, not a surface.
- Green glow is dark-sections only. On light backgrounds a green glow just looks like a rendering bug.

**Aesthetic target:** premium consulting firm that happens to ship software. References: **Linear**, **Vercel**, **Stripe**, **Supabase** (closest working reference for our color system).

**Anti-references — do not go here:** neon grids, robotic meshes, circuit-board patterns, glowing "AI brain" imagery, matrix rain, floating 3D blobs. These read as cold and techy, which contradicts everything in §2 and §3. Our buyer is a business owner, not a developer.

### Typography

- **Display + body:** General Sans (Fontshare). One family carries the page.
- **Labels, stats, numerals, code:** JetBrains Mono — used *sparingly*, for numbers and data labels only. Not for eyebrows above every heading.
- Body line length: under 75 characters.
- Type scale should be decisive — big jump between headline and body, no timid mid-sizes.
- **Avoid:** tracked-out ALL-CAPS eyebrow labels above every heading, accenting one word of a headline in green, `→` appended to every link.

---

## 6. Motion system

Motion is a support act. The site should feel calm and confident, not busy.

### Rules

- **One orchestrated moment per page.** The hero gets the signature animation. Everything else is quiet.
- Scroll-triggered fade-and-slide-up on *every* section is the generic AI-site default. Don't. Reveal sparingly — only where the reveal itself carries meaning.
- Motion that answers a user action (opening, expanding, confirming, submitting) is always welcome.
- Durations: 200–400ms for interface response, up to 800ms for a hero sequence. Nothing slower.
- Easing: standard ease-out for entrances. No bounce, no elastic.
- `prefers-reduced-motion` must be respected everywhere. Every animated component needs a static fallback.
- Animation must never block content. Text is readable before the animation finishes.

### Library allocation

| Library | Use it for | Don't use it for |
|---|---|---|
| **shadcn/ui (radix-nova)** | All structural UI: buttons, inputs, dialogs, tabs, accordions, forms, navigation | Anything decorative |
| **GSAP** | The hero sequence, the line-field visualisation, any scroll-driven timeline | Simple hovers |
| **Magic UI** | Marquee (client logos), number ticker (stats), animated beam (only inside the process/dark section), text reveal on the one hero headline | Sparkles, meteors, confetti, particles anywhere |
| **Aceternity** | At most **two** components across the entire site. Candidates: the card-hover effect on case study cards, or a spotlight on one dark section | Background beams, tracing beams, wavy backgrounds, aurora, vortex, globe, 3D card tilt on everything |
| **Framer Motion** | Layout transitions, page transitions, staggered lists where stagger conveys sequence | Making every element float |

**The rule for Aceternity and Magic UI:** these libraries are designed to be impressive in a demo. Used liberally they make a site look like every other AI agency site in 2026. Pick the two or three effects that carry meaning and delete the rest. Spend the boldness in one place.

---

## 7. Tech and conventions

```
Next.js 16 (App Router) · React 19 · TypeScript
Tailwind v4 · shadcn/ui (radix-nova)
GSAP · Framer Motion · Magic UI · Aceternity (sparingly)
Supabase (auth, DB, storage)
Anthropic API (claude-sonnet-5) via a provider adapter — OpenAI as fallback
Vercel deployment
```

Conventions:
- Server components by default. `"use client"` only where interaction demands it.
- Every animated component ships with a reduced-motion static state.
- All copy lives in a typed content file per page, not hardcoded in JSX. Copy will be iterated on far more often than layout.
- Lighthouse: performance ≥ 90 on mobile. Animation libraries must be dynamically imported below the fold.
- Semantic HTML, visible keyboard focus, WCAG AA contrast. Non-negotiable — we sell compliance-grade builds, the site has to hold up.

---

## 8. Page-by-page specification

### 8.1 Homepage

The homepage has one job: make the visitor think **"that's us"** — then hand them one obvious next step (book the audit).

Structure, top to bottom:

---

**① Hero — LIGHT — locked design, copy open**

The current hero direction is approved: a large split headline with a live input where the visitor describes their business, feeding a Claude-powered analysis that drives the animated line-field visualisation (chaos → resolution, red → green).

This is the signature moment of the entire site. It's a live demo, not a promise — that's what makes it work. Reference: **Linear**'s hero shows the product; **Stripe** shows real code. We show the audit actually running.

Copy direction to explore (current "Messy in / Aligned out" is workable, these are alternatives to test):
- Something naming the leak, not the technology
- Sub-line must answer "what do I get and what does it cost me" — the current "Tell us what's broken. We'll show you the fix" is close, but should hint that it's free and fast
- Primary CTA: "Book the audit" · Secondary: the live input itself

Requirements:
- Input needs an example prompt visible so nobody stares at an empty box
- Loading state must be interesting, not a spinner
- Output must be genuinely useful — a specific named leak plus rough arithmetic, not flattery. If the output is generic, the whole page loses credibility
- Rate limit it and handle the failure state gracefully (fallback: show a pre-computed example)
- Result should end with a soft handoff to the full audit booking

---

**② Trust bar — LIGHT**

Client logos, quiet marquee, small. Only real clients. No "as seen in." Label it accurately — "Teams we've built for," not "Trusted by 500+ companies."

---

**③ The problem — LIGHT**

The mirror section. Describe their Tuesday. Three or four short scenarios the reader recognises, in plain language: the Friday 7pm lead, the Monday morning retyping, the 8,000 dormant contacts, the four-hour Friday report.

No solution here. No product names. Just recognition. End on a question or a single line of implication.

Design: text-forward, generous space, minimal decoration. This section should feel like someone read their mind, not like a feature grid. Reference: **Basecamp/37signals** long-form landing pages — plain, confident, zero ornament.

---

**④ The arithmetic — LIGHT, could be an interactive block**

One leak, one calculation, real numbers. Ideally a small interactive calculator: the visitor enters two or three numbers (leads/month, team size, hours on admin) and sees the annual cost.

This is the highest-value non-hero interaction on the site. Owners believe their own arithmetic more than anyone's research. Reference: how **Ramp** and **Gusto** use savings calculators — inputs on the left, a single big number on the right, no signup wall.

Framing rule: convert hours into headcount. "50 hours a month" is abstract. "A third of a person, permanently, doing data entry" is a decision.

---

**⑤ How we work — DARK**

Audit → Build → Run. Three steps, week markers, what's delivered at each.

This is where the process visualisation lives (the current animated pipeline is good). Dark treatment here does real work: it marks the shift from "your problem" to "our method."

Copy must include the overlay promise explicitly: *your systems stay, your team doesn't learn a new tool, nothing gets migrated.*

Numbered markers (01/02/03) are permitted **here only**, because this genuinely is a sequence.

---

**⑥ What changes — DARK or LIGHT (pick one, not both dark in a row with ⑤)**

Outcome stats with number tickers. **Every number here must be real and defensible.** See §12. If we can't source it, we don't show it. Better to show three honest numbers than six invented ones.

Frame outcomes as hours returned, response times, and coverage — things we control. Never guaranteed conversion percentages.

---

**⑦ Work — LIGHT**

Case study cards, filterable. Each card leads with the **outcome in owner language**, then the client type, then a quiet tag row for the technical reader.

Good: "Five tools became one CRM. Lead intake to invoice, one pipeline."
Bad: "Multi-tenant CRM built with Next.js and Supabase."

Cards must link to real case study pages (§8.3), not to /contact. A card that promises "Read case study" and delivers a contact form burns trust instantly.

Reference: **Metalab** and **Work & Co** case study indexes — big imagery, outcome-first titles, restraint.

---

**⑧ Testimonials — LIGHT**

Real quotes from real clients with permission, with real names and companies. If we only have one, show one. One real testimonial beats six invented ones, and invented ones are a legal and reputational risk (§12).

Until we have collected them: replace this section entirely with a results block, or cut it. An empty-but-honest site outperforms a full-but-fabricated one.

---

**⑨ Objections — LIGHT, accordion**

The questions they're already thinking. Answer them plainly.

- "We tried automation and it broke." → Ask what broke. Usually no exception handling and no owner. Both are design failures, not automation failures.
- "My business is too unique." → The judgment is unique. The typing isn't. We automate the typing.
- "We don't have the data." → Then the first engagement is finding out what you have. That's a deliverable, not a blocker.
- "My team will resist." → They resist replacement. They don't resist losing the task they complain about.
- "What if it makes a mistake?" → It will. So does the manual process; you just don't measure that one. The design question is what happens when it's unsure — and the answer is a human sees it.
- "Can't we just use ChatGPT?" → For one document, yes. The work is what happens on document 200, at 2am, when one arrives in a format nobody expected.
- "Too expensive." → Compared to what? Run the math against the salary already spent on the task.

Include at least one answer that names a limit of what we do. That's the trust move.

---

**⑩ Final CTA — DARK**

Booking. Embedded calendar, short. State exactly what happens on the call: 30 minutes, no prep, no pitch, and they keep the findings either way.

---

**⑪ Footer — LIGHT**

Standard. No fake status indicators unless we actually run a status page. "Built in Pakistan" stays — it's honest and it's differentiating.

---

### 8.2 Services pages (one per system)

Five pages, same template: `/services/speed-to-lead`, `/document-processing`, `/follow-up`, `/reactivation`, `/reporting`.

Template:
1. **Symptom** — the sentence the owner actually says out loud
2. **Where the money leaks** — the specific gap between two roles
3. **The math** — the calculation, with a worked example using round numbers
4. **What we build** — mechanism in plain language, no tool names
5. **What stays manual** — explicitly. This section is the credibility
6. **Objections** — the two or three specific to this system
7. **Related work** — link to case studies
8. **CTA** — book the audit

All light theme. One dark block permitted for the "how it works" mechanism.

**Sequencing note for the site's internal linking:** lead people toward speed-to-lead or document processing first — acute, measurable, fast to prove. Reporting is the deepest, stickiest engagement but the hardest to sell cold, so it should be positioned as an expansion, not an entry point.

---

### 8.3 Case study pages

One page per real project. Template:

- **Outcome headline** — what changed, in owner language
- **Client + industry + region** (or anonymised sector if under NDA)
- **The situation** — what was broken before, in specifics
- **What we built** — plain language first, then a collapsible technical detail section for the technical reader
- **The result** — measured, with baseline. No baseline, no claim
- **What still needs a human**
- Screenshots or a short screen recording
- CTA

**Priority order to build — SME-relatable first:**
1. **MCR Group** (Bellissima Studio + Skin Clinic) — two small businesses, one owner, unified CRM. This is the single most relatable story we have for an SME reader. Build it first.
2. **IFG** — five disconnected tools replaced by one automated pipeline. Strongest automation narrative.
3. **Drive-247** — a rental operator's daily workflow, including instant approvals in checkout.
4. **Hiretics** — hiring automation, easy for any owner to picture.
5. **Vidacure** / **METER** — sector depth.
6. **D360 Bank** — keep it, but as a credibility line ("we built Saudi Arabia's first digital bank"), not as the lead card. Leading with a bank makes a 25-person clinic assume we're out of their price range.

Same logic for the trust bar: mix the recognisable names with businesses that look like the reader's.

NDA projects: say "under NDA, full walkthrough on request" rather than inventing detail.

---

### 8.4 The audit page — `/audit` (this is the offer, and it carries pricing)

The single most important conversion page after the homepage.

- **What the audit is:** we map how work actually flows, score where AI pays off first, and hand over a prioritised roadmap
- **What they get:** a workflow map, a ranked list of leaks with a cost attached to each, and a first-project recommendation
- **What it costs and how long it takes** — stated plainly, on the page
- **What happens after** — no obligation, they keep the findings either way
- **Who runs it** — Ghulam and Abubakar, real photos, real names
- Booking embed

**Pricing block — required.** SMEs will not fill in a form to find out if they can afford you. Publish:
- Audit price (or "free" if that's the offer — but say which)
- A starting-from figure for a first build, with the typical range
- Retainer starting-from for ongoing work

Frame all three against the alternative they were already considering: *"a part-time ops hire costs $X a month, forever."*

If exact pricing can't be published yet, publish the **shape**: "Most first projects land between $A and $B and go live in 4–6 weeks." That single sentence removes the biggest reason an SME closes the tab.

Reference: **Basecamp**, **Fathom**, and **DesignJoy** all publish price on the homepage and convert on it. Enterprise vendors hide pricing because their deals are negotiated. Ours aren't.

---

### 8.5 About — `/about`

Small agency, real people. Founders, the team, where we are, how we work. Show faces. For an SMB buyer in the US or GCC hiring a Lahore-based team, the "these are real people who will answer my email" signal matters more than any capability claim.

Include the working principles: end-to-end ownership, compliance from day one, no over-engineering, humans where judgment matters.

---

### 8.6 Contact — `/contact`

Short form. Name, email, company, one open field: "What's the thing that keeps breaking?" That question does more qualifying work than a dropdown ever will.

Auto-reply must go out immediately — we sell speed-to-lead, so a slow reply from our own form is fatal. Ship this properly.

---

### 8.7 Later (build after launch)

- `/blog` — the content engine, using the post patterns in §4
- `/careers`
- `/privacy`, `/terms` — must exist before launch, actually written

---

## 9. Reusable components

Build these once:

- `<Section>` — handles light/dark theming, padding rhythm, max-width
- `<Eyebrow>` — used sparingly, not above every heading
- `<StatBlock>` — number ticker + label + source note
- `<CaseCard>`
- `<LeakCalculator>` — the arithmetic block, reusable across service pages with different inputs
- `<ObjectionAccordion>`
- `<BookingEmbed>`
- `<AuditInput>` — the hero's live analysis, reusable on `/audit`

---

## 10. Conversion architecture

- **One primary CTA across the whole site: "Book the audit."** Every other action is secondary. Don't compete with yourself.
- CTA appears in the nav (persistent), after the arithmetic section, after work, and at the end. Four times on the homepage. Not more.
- Nothing gated. No email walls on the calculator or the audit tool. The audience is allergic to it, and the tool *is* the marketing.
- Forms: as few fields as possible. Every field costs conversions.
- Mobile is the primary design target for the CTA path — a lot of GCC traffic will be phone-first.

---

## 11. Anti-patterns

Things that will make this site look like every other AI agency page. Avoid all of them:

- A hero that says "AI-powered solutions for modern businesses"
- Floating 3D shapes, orbs, or neural network graphics
- Six identical rounded cards with the same soft grey shadow
- An ALL-CAPS tracked-out eyebrow above every single heading
- "Trusted by 500+ companies" with generic grey logos
- A "Why choose us?" section with four icons and four adjectives
- Stats without sources
- A tech stack logo wall on the homepage (our buyer doesn't care, and it makes us look like a dev shop instead of a business partner)
- Chatbot bubble in the corner that does nothing useful
- Testimonials with stock photos

---

## 12. Claims, proof, and compliance — hard rules

**This section overrides everything else. Read it before writing any number or badge.**

1. **Never display a certification we don't hold.** SOC 2 Type II, ISO 27001, PCI DSS Level 1 and HIPAA are audited certifications, not aspirations. Showing a badge for an audit we haven't passed is a misrepresentation with real legal exposure.
   **For an SME audience the badge wall should come out entirely** — it's enterprise theatre that signals "expensive and slow," which is the exact objection we're fighting. Replace it with one honest line inside the process section: *"We've shipped under HIPAA, GDPR and WCAG — Vidacure and PhysioGuidance both run under them. Your data stays in your systems and every agent action is logged."* Shorter, truer, and it answers what an owner actually worries about: *is my customer data safe and can I see what the thing did?*

2. **Never invent testimonials or client names.** Made-up quotes attributed to real client companies is the single fastest way to lose a deal and create a legal problem. Every quote needs a real person who approved it in writing.

3. **Every number needs a source.** Uptime figures need monitoring data behind them. "Hours saved" needs a measured baseline. If there's no baseline measurement, there's no claim.

4. **Statistics we can cite** (always with the year):
   - Oldroyd / InsideSales Lead Response Management, 2007 — contacting a web lead at 5 minutes vs 30 minutes changed the odds of *making contact* by ~100x and the odds of *qualifying* by ~21x. Say the year; it's old, and saying so buys credibility.
   - Harvard Business Review, 2011 (Oldroyd, McElheran, Elkington), 2,241 US firms — average first response time ~42 hours.
   - Ardent Partners AP benchmarks, 2025 — cost per invoice ~$9–13 average vs ~$2.78 best-in-class; cycle time ~9–11 days vs ~3.

5. **Statistics we never use** — these circulate everywhere and are unsourced. Using them marks us as people who repeat things:
   - "80% of sales require 5 follow-ups"
   - "1,200% ROI on database reactivation"
   - "78% of buyers purchase from whoever responds first"

6. **Never collapse odds of contact into odds of sale.** "21x more likely to have a real conversation" is honest. "21x more sales" is not.

7. **Never promise:** guaranteed conversion percentages, 100% extraction accuracy, "fully autonomous," or "set and forget."

**When in doubt, replace the statistic with the arithmetic.** Arithmetic can't be debunked, and it's more persuasive anyway.

---

## 13. SEO and meta

- Title pattern: `Gamma — [specific outcome]`. Not "Gamma | AI Solutions Agency."
- Meta descriptions written for the owner, not the crawler.
- OG image per page, on-brand, readable at small size.
- Service pages target problem-language search terms ("stop retyping invoices," "leads not getting called back"), not technology terms.
- Schema markup for Organization and each case study.
- `sitemap.xml`, `robots.txt`, canonical tags.

---

## 14. Pre-ship checklist

Run this on every section before considering it done:

- [ ] Does it open with a symptom the reader recognises, not a solution?
- [ ] Would a 30-person business see *themselves* here, or does it read like it's built for a corporation?
- [ ] Can the reader find cost and timeline without filling in a form?
- [ ] Is there exactly one green accent element visible in this viewport?
- [ ] On light sections, is the green a fill or a thick mark — never small text or a hairline?
- [ ] Would an owner with no technical background understand every word?
- [ ] Is every number on screen sourced or measured?
- [ ] Is every logo, name, and quote real?
- [ ] Does it work at 375px?
- [ ] Does it degrade gracefully with `prefers-reduced-motion`?
- [ ] Is keyboard focus visible?
- [ ] Is contrast AA on both light and dark treatments?
- [ ] Have we removed one thing? (If nothing has been cut, cut something.)

---

## 15. Build order

1. Design tokens, typography, `<Section>` primitive, light/dark section system
2. Nav + footer
3. Homepage hero (locked design, copy iteration)
4. Homepage sections ② → ⑪
5. `/audit`
6. Case study template + the first three real case studies
7. Five service pages
8. `/about`, `/contact`
9. `/privacy`, `/terms`
10. SEO, OG images, analytics
11. Performance and accessibility pass

---

*Last updated: September 2026*
