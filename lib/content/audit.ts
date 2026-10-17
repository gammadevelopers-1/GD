export const audit = {
  hero: {
    eyebrow: "The audit",
    headline: { one: "Let’s fit AI where", two: "it saves you money." },
    lead: "Thirty minutes on a call, and you will know exactly where AI belongs in your business — and where it doesn’t. Ranked, in writing, by what each gap is costing you today.",
    cta: { label: "Book the audit", href: "#book" },
    note: "Free · 30 minutes · the plan is yours either way",
  },

  scope: {
    eyebrow: "Why the hours run out",
    heading: { one: "Your day has a ceiling.", two: "A system’s doesn’t." },
    lead: "None of this is a people problem. A business runs out of hours long before it runs out of will, and every ceiling below is one your team hits through no fault of their own.",
    columns: { people: "A team of people", system: "A system that runs it" },
    pairs: [
      { people: "Stops at six", system: "Runs at three in the morning" },
      { people: "One thing at a time", system: "Four hundred at once" },
      { people: "Remembers most of it", system: "Forgets nothing" },
      {
        people: "Gets sick, takes leave, moves on",
        system: "Does none of that",
      },
    ],
    close: {
      one: "You are not short of good people.",
      two: "You are short of hours.",
    },
    note: "The thirty minutes works out which of these ceilings is costing you the most right now.",
  },

  session: {
    eyebrow: "The session",
    heading: { one: "Thirty minutes,", two: "and what lands after." },
    lead: "No prep, no slides, and nothing to fill in beforehand. You talk, we map, and you get the straight answer before the call ends.",
    track: [
      {
        time: "0–5 min",
        title: "What the business does",
        body: "In your own words. We are listening for the shape of the work, not the org chart.",
      },
      {
        time: "5–25 min",
        title: "One job, start to finish",
        body: "We take a single job and walk it end to end. Every tool it touches, every person it waits on, every point it stalls.",
      },
      {
        time: "25–30 min",
        title: "The straight answer",
        body: "Whether there is anything here worth building. Sometimes there isn’t, and you hear that on the call.",
      },
      {
        time: "+48 hours",
        title: "It arrives in writing",
        body: "The plan, in a document that makes sense without us in the room. Yours to keep, act on, or hand to somebody else.",
        after: true,
      },
    ],
    footnote:
      "Both founders are on the call. Nobody is going to read you a deck.",
  },

  book: {
    eyebrow: "Book it",
    heading: { one: "Pick a time.", two: "We\u2019ll do the rest." },
    lead: "Take whichever slot suits you. Thirty minutes on a call, and the written plan is in your inbox within two days.",
    assurances: [
      "No obligation",
      "Nothing to prepare",
      "The plan is yours either way",
    ],
    fallback: "Prefer email? Write to us and we reply within one business day:",
  },
} as const;
