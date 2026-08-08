export const hero = {
  headline: { before: "Messy in.", accent: "Aligned", after: "out." },
  lead: "Describe the bottleneck. See the system fixed.",
  placeholder: "What keeps getting lost, delayed, or repeated?",
  cta: "Run the audit",
  idleProblems: [
    "leads going cold",
    "manual data entry",
    "stale records",
    "missed follow-ups",
  ],
  idleFixes: [
    "every lead answered",
    "entered once",
    "one source of truth",
    "follow-ups run themselves",
  ],
  examples: [
    {
      label: "dental clinic",
      value:
        "dental clinic, 3 staff, bookings come by phone and WhatsApp and get lost",
    },
    {
      label: "agency",
      value:
        "marketing agency, 8 people, projects and invoices tracked in spreadsheets",
    },
    {
      label: "car rental",
      value:
        "car rental company, 40 vehicles, bookings by email, approvals done manually",
    },
    {
      label: "trades",
      value:
        "plumbing business, 6 engineers, jobs booked by phone, quotes written by hand",
    },
    {
      label: "accounting",
      value:
        "accounting firm, 12 people, client onboarding documents chased over email",
    },
  ],
} as const;

export const flow = {
  eyebrow: "The flow",
  title: "One path, from the moment work arrives.",
  steps: [
    {
      key: "IN",
      num: "01",
      title: "Arrives",
      body: "Email, form, call or WhatsApp. Every channel, one queue.",
    },
    {
      key: "READ",
      num: "02",
      title: "Understood",
      body: "The agent reads it properly, not by keyword.",
    },
    {
      key: "SORT",
      num: "03",
      title: "Routed",
      body: "Priority, owner and next step decided automatically.",
    },
    {
      key: "DO",
      num: "04",
      title: "Actioned",
      body: "Records updated, replies sent, invoices raised.",
    },
    {
      key: "LOG",
      num: "05",
      title: "Recorded",
      body: "Every step logged, so you can audit any decision.",
    },
  ],
} as const;

export const capabilities = {
  eyebrow: "What we build",
  title: "Systems that hold, after we leave.",
  items: [
    {
      title: "Production AI agents",
      body: "Agents that own a real outcome inside a real workflow, with logs you can audit when something goes wrong.",
      panel: {
        label: "agent · intake",
        rows: [
          ["inbound received", "14:02"],
          ["intent classified", "warm"],
          ["record created", "crm"],
          ["reply sent", "61s"],
        ],
        footer: "1,284 handled this month",
      },
    },
    {
      title: "Internal platforms",
      body: "Dashboards, CRMs and admin tools that replace the spreadsheet everyone quietly depends on.",
      panel: {
        label: "internal dashboard",
        rows: [
          ["open projects", "7"],
          ["unpaid invoices", "2"],
          ["leads this week", "38"],
          ["team capacity", "82%"],
        ],
        footer: "live across 4 sources",
      },
    },
    {
      title: "Systems integration",
      body: "Connecting the tools you already pay for, so nothing gets retyped between them.",
      panel: {
        label: "integrations",
        rows: [
          ["website form", "synced"],
          ["accounting", "synced"],
          ["inbox", "synced"],
          ["calendar", "synced"],
        ],
        footer: "0 manual entries today",
      },
    },
    {
      title: "Ongoing engineering",
      body: "A retained team that keeps shipping after launch, not a handover and a goodbye.",
      panel: {
        label: "retained engineering",
        rows: [
          ["tickets closed", "19"],
          ["deploys this week", "6"],
          ["uptime", "99.98%"],
          ["first response", "< 2h"],
        ],
        footer: "shipping since launch",
      },
    },
  ],
} as const;

export const proof = {
  eyebrow: "Proof",
  title: "Running right now.",
  cases: [
    {
      status: "In production",
      title: "Five tools became one CRM",
      body: "Lead intake, email, scheduling, invoicing and the client portal running as a single pipeline.",
      meta: "Sports · education → Next.js, Supabase",
      thumb: ["w6", "w8-accent", "w4"] as const,
    },
    {
      status: "In production",
      title: "Approvals cut from hours to seconds",
      body: "Live identity and licence checks dropped straight into the booking flow.",
      meta: "Vehicle rental · US → AWS, Stripe Connect",
      thumb: ["w4", "w6", "w8-accent"] as const,
    },
    {
      status: "In production",
      title: "10,000 CVs ranked without a recruiter",
      body: "Semantic matching that reads the role and the person, not keyword overlap.",
      meta: "HR tech → Lambda, DynamoDB, OpenAI API",
      thumb: ["w8", "w4-accent", "w6"] as const,
    },
  ],
} as const;

export const faq = {
  eyebrow: "Questions",
  title: "Asked on every first call.",
  items: [
    {
      q: "How long until something is actually running?",
      a: "Six weeks is typical for a first agent in production. The audit itself takes half a day and you get the findings inside a week.",
    },
    {
      q: "Our data is a mess. Is that a problem?",
      a: "It's the normal starting point. Sorting out records is part of the work, not a prerequisite for it.",
    },
    {
      q: "Do we need a technical team in-house?",
      a: "No. We document everything and train whoever owns the process, then stay reachable after launch.",
    },
    {
      q: "Will our staff lose their jobs?",
      a: "Every client so far has moved people onto work that was being neglected. We take the tasks nobody wanted.",
    },
  ],
} as const;

export const closing = {
  eyebrow: "Start here",
  title: "Everything lands here.",
  body: "Thirty minutes. We look at how you work and tell you where the time is going. You keep the list either way.",
  cta: "Book an AI audit",
} as const;
