export const hero = {
  headline: { before: "Messy in", accent: "Aligned", after: "out" },
  lead: "Tell us what’s broken. We’ll show you the fix",
  typingPrompts: [
    "Run an audit to spot workflow flaws",
    "What’s slowing your team down?",
    "e.g. I run a dental clinic with three staff...",
    "Leads arrive on WhatsApp and get missed...",
    "We enter every booking into two systems...",
    "Approvals still happen manually by email...",
  ],
  cta: "Analyze my workflow",
} as const;

export const marquee = {
  label: "Trusted by teams that already run",
} as const;

export const method = {
  eyebrow: "How we work",
  title: "From messy workflow to agents in production.",
  body: "We don’t sell a platform you have to learn. We audit how you work, build agents into the tools you already use, and keep them running — every decision logged and auditable.",
  console: {
    title: "gamma-agent  //  mapping your pipeline",
    stages: [
      { key: "audit", label: "Audit" },
      { key: "build", label: "Build" },
      { key: "run", label: "Run" },
    ],
    tasks: [
      {
        stage: "audit",
        fill: 1,
        card: { title: "Map your workflow", meta: "User task" },
        log: "> audit · mapping your workflow…",
        done: "✓ 22 steps mapped",
      },
      {
        stage: "build",
        fill: 0.34,
        card: { title: "Connect your tools", meta: "Agent task" },
        log: "> build · connecting your tools…",
        done: "✓ 6 apps linked",
      },
      {
        stage: "build",
        fill: 0.67,
        card: { title: "Design the pipeline", meta: "User task" },
        log: "> build · designing the pipeline…",
        done: "✓ approved by you",
      },
      {
        stage: "build",
        fill: 1,
        card: { title: "Ship first agent", meta: "Agent · approval" },
        log: "> build · shipping first agent…",
        done: "✓ live in production",
      },
      {
        stage: "run",
        fill: 0.34,
        card: { title: "Route & action", meta: "Agent task" },
        log: "> run · routing work…",
        done: "✓ auto-assigned",
      },
      {
        stage: "run",
        fill: 0.67,
        card: { title: "Log every step", meta: "Agent task" },
        log: "> run · logging every step…",
        done: "✓ audit trail written",
      },
      {
        stage: "run",
        fill: 1,
        card: { title: "Train your team", meta: "User task" },
        log: "> run · training your team…",
        done: "✓ handover complete",
      },
    ],
  },
  phases: [
    {
      num: "01",
      icon: "search",
      title: "Audit",
      when: "Week 1",
      body: "We map how work actually flows today — every tool, handoff and bottleneck — and score where AI pays off first. No slideware, just the real picture.",
      points: [
        "Workflow map & time-sink audit",
        "Prioritised roadmap with ROI",
      ],
    },
    {
      num: "02",
      icon: "build",
      title: "Build",
      when: "Weeks 2–6",
      body: "We ship the first agent into your real stack — wired to the tools you already pay for, with human approval on anything that matters. Working software, not a demo.",
      points: ["Agent live in your stack", "Human-in-the-loop approvals"],
    },
    {
      num: "03",
      icon: "run",
      title: "Run",
      when: "Ongoing",
      body: "We keep it running and improving — every decision logged and auditable, uptime we stand behind, and a retained team that keeps shipping after launch.",
      points: [
        "Full audit trail on every action",
        "Retained team & 99.98% uptime",
      ],
    },
  ],
} as const;

export const outcomes = {
  eyebrow: "What our clients gain",
  title: "What changes after we ship.",
  body: "Measured across live engagements — not projections.",
  stats: [
    {
      value: 20,
      suffix: "+",
      body: "Hours back every week per team — the manual data entry and routing, gone.",
      label: "Time reclaimed weekly",
    },
    {
      value: 6,
      unit: "weeks",
      body: "From first audit to a working agent live in your stack.",
      label: "Audit to live",
    },
    {
      value: 30,
      suffix: "×",
      body: "More records handled once an agent took over the manual queue.",
      label: "Throughput lift",
    },
    {
      value: 99.98,
      decimals: 2,
      suffix: "%",
      body: "Uptime across every system we run — measured since launch.",
      label: "Uptime, since launch",
    },
  ],
} as const;

export const work = {
  eyebrow: "Case studies",
  title: "Products we’ve shipped into production.",
  body: "Live products, running with real clients today.",
  filters: [
    { key: "all", label: "All work" },
    { key: "platforms", label: "Platforms & CRMs" },
    { key: "agents", label: "AI agents" },
    { key: "integrations", label: "Integrations" },
  ],
  cases: [
    {
      category: "platforms",
      image: "/case-study.jpg",
      sector: "Sports academy · Education",
      title: "Five tools unified into one CRM",
      body: "Lead intake, scheduling, invoicing and the client portal, running as one pipeline.",
      tags: ["CRM", "Next.js", "6-week build"],
    },
    {
      category: "agents",
      image: "/case-study2.jpg",
      sector: "HR tech",
      title: "CV ranking engine, no recruiter",
      body: "Semantic matching that reads the role and the person, not keyword overlap.",
      tags: ["AI agent", "Semantic search", "HR-tech"],
    },
    {
      category: "integrations",
      image: "/case-study.jpg",
      sector: "Vehicle rental · US",
      title: "Instant approvals in the booking flow",
      body: "Live identity and licence checks dropped straight into checkout.",
      tags: ["KYC", "Stripe", "Fintech"],
    },
    {
      category: "platforms",
      image: "/case-study2.jpg",
      sector: "Retail chain",
      title: "Live operations dashboard",
      body: "One screen across four data sources — orders, stock, staff and revenue.",
      tags: ["Dashboard", "Realtime", "Retail"],
    },
    {
      category: "agents",
      image: "/case-study.jpg",
      sector: "Logistics",
      title: "Dispatch automation",
      body: "An agent that reads every job and routes it to the right driver automatically.",
      tags: ["AI agent", "Routing", "Logistics"],
    },
    {
      category: "integrations",
      image: "/case-study2.jpg",
      sector: "Clinic network · Healthcare",
      title: "Two booking systems, one calendar",
      body: "Bookings stopped being retyped, giving the front desk a day back each week.",
      tags: ["Integration", "Calendar sync", "Healthcare"],
    },
  ],
} as const;

export const testimonials = {
  eyebrow: "What people say",
  title: "Loved by teams that\nalready run.",
  listTitle: "Testimonies",
  listBody: "Endless happy clients.",
  items: [
    {
      name: "Sara Malik",
      handle: "@saramalik",
      role: "Ops Lead, Cortek",
      initials: "SM",
      quote:
        "Our intake used to live in three inboxes. Now every lead lands in one queue, sorted before we even open it.",
    },
    {
      name: "Bilal Ahmed",
      handle: "@bilald360",
      role: "Founder, D360",
      initials: "BA",
      quote:
        "They replaced the spreadsheet the whole company secretly depended on. Six weeks later it was in production.",
    },
    {
      name: "Dr. Ayesha Khan",
      handle: "@drayeshak",
      role: "Clinic Manager, Vidacure",
      initials: "AK",
      quote:
        "Bookings no longer get retyped between two systems. That alone gave my front desk a day back every week.",
    },
    {
      name: "Hamza Sheikh",
      handle: "@hamzatap",
      role: "Owner, Royal Tap",
      initials: "HS",
      quote:
        "Approvals that used to take hours are instant now, and I can audit every decision the agent made.",
    },
  ],
} as const;

export const compliance = {
  eyebrow: "Compliance & trust",
  title: "Built to the rules your regulators already check.",
  body: "We handle real business data, so governance isn’t an afterthought. Every agent action is logged and auditable, and our delivery is aligned to the standards below.",
  note: "Row-level security, encrypted document storage, and full audit trails on every deployment.",
  cta: "Request trust report",
  standards: [
    {
      name: "SOC 2 Type II",
      body: "Security, availability and confidentiality controls, independently audited.",
    },
    {
      name: "ISO/IEC 27001",
      body: "Information-security management applied across our delivery lifecycle.",
    },
    {
      name: "GDPR",
      body: "Lawful processing, data-subject rights and EU data handling by default.",
    },
    {
      name: "PCI DSS",
      body: "Cardholder data handled to Level 1 service-provider standards.",
    },
    {
      name: "HIPAA",
      body: "Safeguards for protected health data on healthcare engagements.",
    },
    {
      name: "Pakistan PDPB",
      body: "Aligned with the Personal Data Protection Bill and local residency.",
    },
  ],
} as const;

export const bookAudit = {
  eyebrow: "Book your audit",
  title: "Grab a time.\nSee where the time goes.",
  body: "Pick a slot below and we’ll walk your workflow live — 30 minutes, no prep, no pitch. You keep the findings either way.",
  brief: {
    org: "Gamma Developers",
    kind: "AI Workflow Audit",
    title: "30-minute call",
    facts: ["30 min", "Google Meet", "PKT · GMT+5"],
    promises: [
      "A live look at where your team’s time actually goes",
      "The first thing worth automating — and the ROI",
      "A written summary — yours to keep, no strings",
    ],
    host: {
      initials: "AR",
      name: "Ahmad Raza",
      role: "Co-founder · leads the audit",
    },
  },
  picker: {
    title: "Select a date & time",
    prompt: "Pick a date to see times",
    slots: [
      "09:00",
      "09:30",
      "10:30",
      "11:00",
      "13:00",
      "14:30",
      "15:00",
      "16:30",
    ],
  },
  form: {
    back: "Back",
    summary: "30-min AI Workflow Audit · Google Meet",
    name: { label: "Name", placeholder: "Sara Malik" },
    email: { label: "Work email", placeholder: "you@company.com" },
    note: {
      label: "What’s the messiest part of your day?",
      hint: "(optional)",
      placeholder: "Leads arrive on WhatsApp and get missed…",
    },
    cta: "Confirm booking",
  },
  done: {
    title: "You’re booked in.",
    cta: "Pick a different time",
  },
} as const;

export const newsletter = {
  title: "Newsletter",
  body: "One useful email a month. No fluff.",
  placeholder: "you@company.com",
  success: "You’re in — watch your inbox for the next dispatch.",
} as const;

export const contact = {
  eyebrow: "Talk to us",
  title: "Let’s find what’s slowing you down.",
  body: "Tell us a little about how you work today. We’ll reply within one business day — usually with a first thing worth automating.",
  teamSizes: ["1–10", "11–50", "51–200", "200+"],
  disclaimer:
    "By sending this you agree to our privacy policy. We never share your details.",
  cta: "Send message",
  success:
    "Thanks — your message is on its way. We’ll reply within one business day.",
  aside: {
    eyebrow: "Skip the form",
    title: "Book a 30-min audit.",
    body: "Grab a slot and we’ll walk through your workflow live.",
    cta: "Open the calendar →",
  },
} as const;
