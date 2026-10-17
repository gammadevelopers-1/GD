import { site } from "@/lib/content/site";

export const nav = {
  links: [
    { label: "AI audit", href: "/audit" },
    { label: "Case studies", href: "/work" },
    { label: "About", href: "/about" },
  ],
  cta: { label: "Book a call", href: site.book },
} as const;

export const hero = {
  eyebrow: "25+ businesses across the GCC and US",
  headline: { one: "Your revenue isn’t missing.", two: "It’s escaping." },
  lead: "It’s going out through the gaps between your tools, your people, and the hours nobody’s working.",
  cta: { label: "Book your AI audit", href: site.book },
  note: "Free · 30 minutes · you keep the findings either way",
  leak: {
    left: { label: "Sales", caption: ["revenue", "generated"] },
    right: { label: "Profit", caption: ["value", "realized"] },
    gap: "gap",
  },
} as const;

export const trustBar = {
  label: "Teams we’ve built for",
  wordmarks: [
    "D360 Bank",
    "Drive-247",
    "Hiretics",
    "Vidacure",
    "METER",
    "IFG",
    "MCR Group",
    "Cars BN",
    "Royal Tap",
    "Just Wills",
  ],
} as const;

export const problem = {
  eyebrow: "The week",
  heading: {
    one: "Your team spends its week",
    two: "on work that runs itself.",
  },
  lead: "Copying, chasing, replying, reporting. It costs salary every month, and it is the easiest money in a business to get back.",
  buckets: [
    {
      icon: "transfer",
      title: "Moving information around",
      text: "The same details get typed from one system into another, every day, by someone paid to do better work.",
    },
    {
      icon: "queue",
      title: "Replying and chasing",
      text: "Enquiries and follow-ups wait for whoever happens to be free, and some of them are never picked up at all.",
    },
    {
      icon: "report",
      title: "Building the same reports",
      text: "Numbers get pulled together by hand to say roughly what they said last week, then again the week after.",
    },
    {
      icon: "clock",
      title: "The hours nobody works",
      text: "Nothing moves between closing and opening, or over a weekend, no matter who is trying to reach you.",
    },
  ],
  close: {
    one: "None of it needs a bigger team.",
    two: "It needs the routine parts to happen without anyone doing them.",
  },
} as const;

export const leaks = {
  heading: {
    one: "Five places the money goes.",
    two: "None of them on a payslip.",
  },
  lead: "Each one starts with a sentence we hear on almost every first call.",
  rows: [
    {
      num: "01",
      label: "Speed to lead",
      quote: "“We get plenty of leads, they just don’t convert.”",
      where:
        "Between form submit and first human contact. The lead didn’t go cold. It went to whoever answered first.",
    },
    {
      num: "02",
      label: "Document processing",
      quote: "“Someone spends Monday retyping invoices into a sheet.”",
      where:
        "Salary spent on typing, plus late fees, missed discounts, and one person who can’t take leave.",
    },
    {
      num: "03",
      label: "Follow-up",
      quote: "“We got 150 registrations and then… I don’t know what happened.”",
      where:
        "Between ‘showed interest’ and ‘written off’. The warmest list they own.",
    },
    {
      num: "04",
      label: "Database reactivation",
      quote: "“We’ve got 8,000 contacts in the CRM.”",
      where:
        "Between acquisition and abandonment. All paid for, all sitting there, while ad spend goes up.",
    },
    {
      num: "05",
      label: "Internal reporting",
      quote: "“Friday disappears into building the same report.”",
      where:
        "Senior people doing assembly work. This one leaks decision quality, not just hours.",
    },
  ],
} as const;

export const handled = {
  eyebrow: "In practice",
  heading: { one: "Watch it", two: "get handled." },
  lead: "Your systems stay. Your team doesn’t learn a new tool. Nothing gets migrated. We add a layer that catches what falls through.",
  body: "Routine work gets done the moment it arrives. Anything unclear goes to a person. Every action is written down.",
  panelLabel: "Handled today",
  events: [
    { label: "Lead · WhatsApp", result: "routed to Sara · replied in 41s" },
    { label: "Invoice · PDF", result: "read · posted to accounts" },
    {
      label: "Booking · web form",
      result: "checked against calendar · confirmed",
    },
    {
      label: "Enquiry · after hours",
      result: "answered · flagged for morning",
    },
    { label: "Quote request", result: "priced · sent · follow-up scheduled" },
  ],
  loading: "Connecting to your systems…",
  loadingCount: "Connecting",
  empty: {
    heading: "Nothing handled yet",
    body: "Events appear here the moment the first system goes live in your stack. Until then, this stays quiet.",
  },
} as const;

export const process = {
  eyebrow: "The process",
  heading: { one: "Start at step one.", two: "Stop at any step." },
  lead: "Nothing here locks you in. The first two steps cost you nothing and end with a written plan that is yours to keep, so the worst case is you walk away knowing exactly where your time and money are going.",
  steps: [
    {
      num: "01",
      phase: "Book a discovery",
      when: "30 minutes",
      badge: "",
      cta: { label: "Book a discovery call", href: site.book },
      outcome:
        "You talk us through how work moves today. We tell you straight whether there is anything here worth automating, and we say so if there isn\u2019t.",
      ticks: [
        "No prep, no slides",
        "You leave knowing if step two is worth it",
      ],
    },
    {
      num: "02",
      phase: "AI audit",
      when: "Week 1",
      badge: "Free",
      cta: null,
      outcome:
        "We map how work actually moves through your business, then show where AI gives you back real hours and real money, and where it would not be worth it. You get the ranked list with the arithmetic attached.",
      ticks: [
        "A workflow map of your business",
        "The plan is yours, built or not",
      ],
    },
    {
      num: "03",
      phase: "AI build",
      when: "Weeks 2\u20136",
      badge: "",
      cta: null,
      outcome:
        "We build only what the audit proved was worth building, into the stack you already pay for, with a person approving anything that matters. Then we stay and keep it running.",
      ticks: [
        "Live in your systems, nothing migrated",
        "A retained team after launch",
      ],
    },
  ],
} as const;

export const changes = {
  eyebrow: "By the numbers",
  heading: { one: "AI deployed into", two: "real businesses." },
  lead: "Not pilots and not demos. Systems running in production across the GCC and the US, inside the tools these teams already had.",
  feature: {
    pill: "Deployed",
    stat: "25+",
    body: "Businesses across the GCC and the US running AI we built, wired into the tools their teams already had.",
  },
  tiles: [
    {
      id: "trend",
      label: "Time saved",
      stat: "23+ hrs",
      note: "Manual repetitive work, per week",
    },
    {
      id: "retention",
      label: "Retention",
      stat: "97%",
      note: "Deployed and retained",
    },
    {
      id: "conversion",
      label: "Lead conversion",
      stat: "12\u219225%",
      note: "Before and after",
    },
  ],
} as const;

export const work = {
  eyebrow: "Selected work",
  heading: { one: "What we\u2019ve built,", two: "and who for." },
  lead: "Four of seven systems running in production. Every one of them started as something a person was doing by hand.",
  cta: "Read the case",
  nda: "Under NDA",
  /** Four on the home page. The rest live on /work. */
  featured: [
    "car-rental-saas",
    "football-recruitment-platform",
    "members-club-platform",
    "physioguidance",
  ],
  all: { label: "View all case studies", href: "/work" },
  prev: "Previous case",
  next: "Next case",
} as const;

export const testimonials = {
  eyebrow: "Clients",
  heading: { one: "From the people", two: "who run it." },
  lead: "Founders, CEOs and CTOs who put something that mattered in our hands. This is what they said afterwards.",
  items: [
    {
      quote:
        "Over a year with us, across several products, not a single job. Ghulam and his team took full ownership of our AI agents and workflow systems and ran them end to end. The management overhead was zero — they scoped their own work, flagged problems before they became problems, and told me straight when a requirement was not worth building rather than quietly building it anyway. One of the very few teams I would hand a product to and stop worrying about.",
      name: "",
      role: "",
      company: "Cortek",
      descriptor: "CEO",
    },
    {
      quote:
        "Strong commitment, professionalism and technical expertise from start to finish. Ghulam and his team were responsive to every piece of feedback, and whenever a requirement changed or something difficult came up, they came back with a solution. I would recommend them for complex, long-term work, and I look forward to continuing the collaboration.",
      name: "",
      role: "",
      company: "PhysioGuidance",
      descriptor: "CTO",
    },
    {
      quote:
        "Ghulam and his team brought Drive247 to life and got it running properly in production — the architecture, the build, and stabilising the whole thing, all handled with real dedication. The best part for me was zero pressure or tension throughout: they took ownership and made sure things were done properly. We are on V2 now, and looking forward to many more milestones together.",
      name: "",
      role: "",
      company: "Drive247",
      descriptor: "Founder \u00b7 Rental SaaS",
    },
    {
      quote:
        "Outstanding technical skills, communication that was clear throughout, and finished on time. What we got was easy for our own team to manage afterwards. Highly recommend, and we will definitely work with them again.",
      name: "",
      role: "",
      company: "CarsBn",
      descriptor: "Director · Marketplace SaaS",
    },
    {
      quote:
        "Ghulam and his team are professional, patient, and a delight to work with. They took what I asked for, understood it, and translated it properly. They worked tirelessly to deliver what I had in my head, and I am very happy with the result.",
      name: "",
      role: "",
      company: "CostSavvy",
      descriptor: "CEO",
    },
    {
      quote:
        "Ghulam and his team exceeded my expectations. The professionalism, the attention to detail, the delivery on time — all of it was impressive, and I never had to follow anything up twice. A smooth process from the first conversation through to the last. Highly recommended.",
      name: "",
      role: "",
      company: "Travel & tour platform",
      descriptor: "Founder",
    },
    {
      quote:
        "Excellent to work with. Very responsive and diligent the whole way through, fast without ever getting careless about the detail, and the quality of the results speaks for itself. A collaboration we fully intend to carry on.",
      name: "",
      role: "",
      company: "NCP",
      descriptor: "Founder",
    },
    {
      quote:
        "I would recommend them to anyone looking for a team that is both skilled and reliable. Straightforward to deal with, consistent in what they delivered, and they did what they said they would do. I am already looking forward to the next venture with them.",
      name: "",
      role: "",
      company: "AI Teachers Academy",
      descriptor: "Founder",
    },
    {
      quote:
        "A great experience from start to finish. Properly managed, clear about what was happening and when, and what they handed over worked the way we had been told it would. We will gladly take the next venture on with them.",
      name: "",
      role: "",
      company: "MCR Group",
      descriptor: "CTO · Salon and skin clinics",
    },
    {
      quote:
        "Skilled, and a great communicator throughout — I always knew where things stood without having to ask. Everything arrived the way it had been described to me, and nothing needed chasing. Very happy with the service, start to finish.",
      name: "",
      role: "",
      company: "Just Wills",
      descriptor: "Director",
    },
    {
      quote:
        "Working with Ghulam and his team has been a genuinely good experience. Well managed, quick to come back on anything we raised, and accurate enough on the detail that very little needed a second pass. We would definitely like to work with them again.",
      name: "",
      role: "",
      company: "Royal Tap",
      descriptor: "CEO",
    },
  ],
} as const;

export const calculator = {
  eyebrow: "The arithmetic",
  heading: { one: "What is it costing you", two: "right now?" },
  lead: "Your numbers, not ours. Drag the sliders and the working stays on screen, so you can check every step of it.",
  note: "Rounded, and only as good as what you put in. The audit measures the real ones against your systems.",
  cta: { label: "Book the audit", href: site.book },
  presets: [
    {
      id: "speed",
      tab: "Speed to lead",
      cadence: "a year",
      caption: "Enquiries that go cold before anyone answers",
      inputs: [
        { label: "Enquiries a month", min: 10, max: 400, step: 5, value: 40 },
        {
          label: "Percent never answered within the hour",
          min: 0,
          max: 100,
          step: 5,
          value: 40,
          suffix: "%",
        },
        {
          label: "Average job value",
          min: 100,
          max: 8000,
          step: 50,
          value: 900,
          prefix: "$",
        },
      ],
    },
    {
      id: "docs",
      tab: "Document processing",
      cadence: "a year",
      caption: "Salary spent moving numbers between two screens",
      inputs: [
        {
          label: "Documents a month",
          min: 20,
          max: 2000,
          step: 10,
          value: 200,
        },
        { label: "Minutes on each one", min: 1, max: 45, step: 1, value: 12 },
        {
          label: "Loaded hourly rate",
          min: 10,
          max: 150,
          step: 1,
          value: 25,
          prefix: "$",
        },
      ],
    },
    {
      id: "followup",
      tab: "Follow-up",
      cadence: "a year",
      caption: "People who showed interest and were never chased",
      inputs: [
        {
          label: "Dropped or no-show every quarter",
          min: 10,
          max: 800,
          step: 10,
          value: 90,
        },
        {
          label: "Percent you would win back",
          min: 1,
          max: 40,
          step: 1,
          value: 10,
          suffix: "%",
        },
        {
          label: "Value of each one",
          min: 50,
          max: 5000,
          step: 50,
          value: 400,
          prefix: "$",
        },
      ],
    },
    {
      id: "reactivation",
      tab: "Database reactivation",
      cadence: "one-off",
      caption: "A list you already paid to build, sitting still",
      inputs: [
        {
          label: "Dormant contacts in the CRM",
          min: 500,
          max: 60000,
          step: 500,
          value: 8000,
        },
        {
          label: "Percent that would convert",
          min: 0.1,
          max: 5,
          step: 0.05,
          value: 0.25,
          suffix: "%",
        },
        {
          label: "Average order value",
          min: 50,
          max: 5000,
          step: 50,
          value: 600,
          prefix: "$",
        },
      ],
    },
    {
      id: "reporting",
      tab: "Internal reporting",
      cadence: "a year",
      caption: "Senior people rebuilding the same numbers by hand",
      inputs: [
        {
          label: "Hours a week rebuilding reports",
          min: 1,
          max: 40,
          step: 1,
          value: 5,
        },
        { label: "People doing it", min: 1, max: 12, step: 1, value: 1 },
        {
          label: "Loaded hourly rate",
          min: 20,
          max: 200,
          step: 5,
          value: 40,
          prefix: "$",
        },
      ],
    },
  ],
} as const;

export const objections = {
  eyebrow: "Straight answers",
  heading: {
    one: "The questions",
    two: "you\u2019re already asking.",
  },
  items: [
    {
      q: "\u201cWhat if you find nothing worth doing?\u201d",
      a: "Then we say so on the call, and you keep the plan anyway. That happens, and it is a better outcome for you than being sold something that was never going to pay for itself.",
    },
    {
      q: "\u201cIs a proposal going to land in my inbox afterwards?\u201d",
      a: "Only if you ask for one. There is no follow-up sequence and nobody will chase you. The plan arrives, and what you do with it is your business.",
    },
    {
      q: "\u201cWe\u2019re too small for this.\u201d",
      a: "Small is where it shows up hardest. When there are four of you, a day a week lost to admin is a fifth of somebody. A large company absorbs that. You cannot.",
    },
    {
      q: "\u201cOur systems are a mess.\u201d",
      a: "That is the normal starting point. If everything were tidy and written down you would not need the thirty minutes. The mess is the thing we are mapping.",
    },
    {
      q: "\u201cDo I have to share my numbers?\u201d",
      a: "Not exact ones. The call works on how the work moves, not on your accounts, and rough ranges are enough to rank what is costing you most.",
    },
    {
      q: "\u201cMy team will think this is about replacing them.\u201d",
      a: "It is not, and you can tell them that honestly. We go after the hours nobody wants \u2014 the typing, the chasing, the checking. Nobody asks to keep those.",
    },
    {
      q: "\u201cWe tried something like this before and it broke.\u201d",
      a: "Usually because nothing handled the exceptions and nobody owned it after launch. Both are design failures rather than reasons to stop.",
    },
    {
      q: "\u201cCan\u2019t we do this ourselves with the tools we already have?\u201d",
      a: "For one task, often yes. The hard part is never the first one \u2014 it is the two hundredth, at 2am, in a format nobody expected, and knowing which task to start with at all.",
    },
  ],
  aside: {
    eyebrow: "What we won\u2019t do",
    heading:
      "We don\u2019t automate judgment calls, anything that needs a relationship, or a process nobody can explain out loud yet.",
    body: "If the thirty minutes finds that is where your time is going, we will say so, and the plan is still yours.",
  },
  cta: {
    eyebrow: "Still not sure",
    label: "Put it on the call",
    href: "#book",
  },
} as const;

export const trust = {
  eyebrow: "Data and compliance",
  line: {
    one: "We\u2019ve shipped under HIPAA, GDPR and WCAG.",
    two: "Your data stays in your systems, and every action is logged.",
  },
  badges: ["HIPAA", "GDPR", "WCAG"],
} as const;

export const finalCta = {
  eyebrow: "The next step",
  heading: { one: "Thirty minutes.", two: "You keep the findings." },
  lead: "No prep, no slides, and no pitch. You keep the findings either way.",
  cta: { label: "Book your AI audit", href: site.book },
  assurances: ["Free", "30 minutes"],
} as const;

export const footer = {
  tagline:
    "Your AI partner — the automation that gives the business you already run a set of superpowers.",
  columns: [
    {
      heading: "Explore",
      links: [
        { label: "AI audit", href: "/audit" },
        { label: "Book a call", href: site.book },
      ],
    },
    {
      heading: "Company",
      links: [
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ],
  /** Drawn from the same list /work renders, so the two cannot drift. Labelled
      by vertical rather than by client: these are case studies, not logos. */
  work: {
    heading: "Proof",
    all: { label: "Case studies", href: "/work" },
    /** Filled from whatever is published. See proofLinks(). */
    label: (vertical: string) => `AI for ${vertical}`,
  },
  newsletter: {
    heading: "Newsletter",
    body: "One email a month on what AI is actually doing inside businesses like yours. Nothing else.",
  },
  legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ],
  rights: "All rights reserved.",
} as const;

export const system = {
  heading: { one: "Five scattered jobs.", two: "One system running them." },
  lead: "Nothing gets replaced. Your team keeps working the way it works today. We add a layer on top that catches what falls through.",
  core: { label: "AI layer", state: "on" },
  closing: "One system, not six inboxes.",
  nodes: [
    {
      label: "Speed to lead",
      before: "“They just don’t convert.”",
      after: "Answered before they call someone else.",
      at: { x: 170, y: 132 },
      from: { x: -58, y: 34, r: -7 },
    },
    {
      label: "Document processing",
      before: "“Monday is retyping invoices.”",
      after: "Read and posted. Nobody retypes.",
      at: { x: 152, y: 452 },
      from: { x: -44, y: -30, r: 6 },
    },
    {
      label: "Follow-up",
      before: "“I don’t know what happened.”",
      after: "Nobody gets forgotten.",
      at: { x: 832, y: 122 },
      from: { x: 62, y: 26, r: 8 },
    },
    {
      label: "Database reactivation",
      before: "“8,000 contacts in the CRM.”",
      after: "The list gets worked, not stored.",
      at: { x: 850, y: 442 },
      from: { x: 48, y: -36, r: -6 },
    },
    {
      label: "Internal reporting",
      before: "“Friday disappears into a report.”",
      after: "Friday comes back.",
      at: { x: 500, y: 562 },
      from: { x: -22, y: 46, r: 5 },
    },
  ],
} as const;
