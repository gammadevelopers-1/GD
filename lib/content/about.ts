/** One of the people on /about. `photo` is empty until a headshot exists,
 *  and the card falls back to initials — typed here rather than inferred,
 *  so `as const` does not narrow an empty photo out of existence the moment
 *  everybody listed happens to have one. */
export type TeamMember = {
  initials: string;
  name: string;
  role: string;
  photo: string;
};

export const about = {
  hero: {
    eyebrow: "About",
    headline: { one: "We are small because", two: "we automated our work." },
    lead: "Everything we build for other people, we ran on ourselves first.",
    card: {
      label: "What we run on ourselves",
      items: [
        "Scoping and proposals",
        "Scheduling and reminders",
        "Client reporting",
        "Follow-up and check-ins",
        "Handover documentation",
      ],
      note: "Which is why there are fewer of us than you would expect.",
    },
  },

  practice: {
    eyebrow: "In practice",
    heading: { one: "We were the first", two: "business we fixed." },
    lead: "The short version of how a team this size ended up carrying the work it carries.",
    beats: [
      {
        n: "01",
        title: "The admin grew faster than the work",
        body: "The part of the week that actually paid kept shrinking. Proposals written from a blank page every time. The same status report rebuilt every Friday. Replies chased, handovers half-written. The obvious fix was to hire somebody to absorb it, which would have moved the problem rather than solved it.",
      },
      {
        n: "02",
        title: "So we pointed it at ourselves",
        body: "We built for our own business the thing we had been building for other people: systems that carry the repeating half and escalate anything that needs a decision. The early versions broke in exactly the ways client projects break — an exception nobody planned for, and nobody owning it after launch. We learned that on our own time instead of somebody else’s.",
      },
      {
        n: "03",
        title: "The week changed shape",
        body: "What is left is the work that needed us: scoping, the calls, and the judgment calls a system should never be making. We stayed small because we stopped needing to grow just to keep up — and we stopped recommending anything we had not lived with first.",
      },
    ],
    close:
      "Every system we put into a business is one we already run ourselves.",
  },

  people: {
    eyebrow: "The team",
    heading: { one: "The people behind", two: "every system we ship." },
    lead: "Anyone can buy the same models. The difference is who decides what to point them at.",
    members: [
      {
        initials: "GM",
        name: "Ghulam Mohi Ud Din",
        role: "Co-founder & CEO",
        photo: "/team/ghulam.jpeg",
      },
      {
        initials: "MA",
        name: "Muhammad Abubakar",
        role: "Co-founder & MD",
        photo: "/team/abubakar.jpeg",
      },
    ],
  },

  cta: {
    eyebrow: "Next step",
    heading: { one: "Talk to the people", two: "who’d build it." },
    lead: "No prep and no pitch. You describe how the work moves today, and you leave knowing whether there is anything here worth doing.",
    button: "Book the AI audit",
    note: "Free · 30 minutes · the plan is yours either way",
  },
} as const;
