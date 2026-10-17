export type ServiceObjection = {
  q: string;
  a: string;
};

export type Service = {
  slug: string;
  name: string;
  title: string;
  symptom: string;
  leak: {
    title: string;
    body: string;
  };
  math: {
    title: string;
    steps: readonly string[];
    result: string;
  };
  build: {
    title: string;
    points: readonly string[];
  };
  manual: {
    title: string;
    body: string;
    points: readonly string[];
  };
  objections: readonly ServiceObjection[];
  source?: string;
};

export const services: readonly Service[] = [
  {
    slug: "speed-to-lead",
    name: "Speed to lead",
    title: "The lead that comes in at 7pm Friday gets answered at 7pm Friday.",
    symptom:
      "“We get plenty of enquiries. I don't know what happens to half of them.”",
    leak: {
      title: "Where the money leaks",
      body: "Marketing's job ends when the form submits. Sales' job starts when the lead is assigned. Nobody owns the minutes in between, and that is where the enquiry you already paid for goes cold.",
    },
    math: {
      title: "The math",
      steps: [
        "40 enquiries a month, and you reach 24 of them.",
        "The 16 you miss cost the same ad spend as the 24 you reach.",
        "If your average job is worth $900 and one in five would have closed, that is three jobs.",
      ],
      result: "About $2,700 a month, leaving through a gap nobody owns.",
    },
    build: {
      title: "What we build",
      points: [
        "Every enquiry gets a reply within a minute, whatever time it arrives",
        "The reply is specific to what they asked, not a generic autoresponder",
        "It reaches whoever is actually on, not a rota nobody updated",
        "Anything unusual gets flagged to a person instead of guessed at",
      ],
    },
    manual: {
      title: "What stays manual",
      body: "The conversation. We handle the first response and the routing; your team handles the part where judgment and a relationship matter.",
      points: [
        "Quoting anything non-standard",
        "Deciding whether a job is worth taking",
        "Every call after the first reply",
      ],
    },
    objections: [
      {
        q: "Won't an instant reply feel like a robot?",
        a: "It does if it reads like one. The reply references what they actually asked about and says when a person will follow up. The goal is to hold the lead, not to close it.",
      },
      {
        q: "We already have an autoresponder.",
        a: "An autoresponder confirms receipt. This one answers the question, checks availability, and puts the enquiry in front of the right person with the context attached.",
      },
    ],
    source:
      "Oldroyd, Lead Response Management study, 2007 — contacting a web lead at five minutes rather than thirty changed the odds of making contact by roughly 100x. The study is old; we cite it with its year.",
  },
  {
    slug: "document-processing",
    name: "Document processing",
    title: "Nobody retypes invoices into the spreadsheet anymore.",
    symptom:
      "“Someone spends most of Monday copying numbers from PDFs into a sheet.”",
    leak: {
      title: "Where the money leaks",
      body: "The document arrives in one system and the number has to end up in another. The gap between those two facts is a person, and that person is doing it at salary rate, every week, forever.",
    },
    math: {
      title: "The math",
      steps: [
        "200 documents a month at 12 minutes each is 40 hours.",
        "At a loaded $25 an hour that is $1,000 a month.",
        "Across a year it is 480 hours — most of a quarter of a person.",
      ],
      result: "About $12,000 a year, to move numbers between two screens.",
    },
    build: {
      title: "What we build",
      points: [
        "It reads the document, pulls out what matters, and flags what is unclear",
        "The numbers land in the system you already use, in the format it expects",
        "Anything it is not sure about goes to a person instead of being guessed",
        "Every extraction is logged, so you can see what it did and why",
      ],
    },
    manual: {
      title: "What stays manual",
      body: "Approval and exceptions. We take the typing; a person still signs off on what gets paid.",
      points: [
        "Approving anything above your threshold",
        "Documents in a format nobody has seen before",
        "Disputes and anything that needs a phone call",
      ],
    },
    objections: [
      {
        q: "What about accuracy?",
        a: "We do not promise perfect extraction and nobody honest does. We promise that when confidence is low it stops and asks, and that every field is traceable back to the page it came from.",
      },
      {
        q: "Our documents are all different.",
        a: "That is the normal case, not the hard one. The hard one is a format that arrives twice a year and looks like nothing else, and that is exactly what gets routed to a person.",
      },
    ],
    source:
      "Ardent Partners accounts-payable benchmarks, 2025 — cost per invoice averages $9–13 against roughly $2.78 for best-in-class, with cycle times of 9–11 days against 3.",
  },
  {
    slug: "follow-up",
    name: "Follow-up",
    title:
      "The 90 people who registered and didn't show up still hear from you.",
    symptom:
      "“We're good with the people in front of us. Everyone else goes quiet.”",
    leak: {
      title: "Where the money leaks",
      body: "Following up is nobody's actual job. It is the thing everyone means to do after the real work, which means it happens when things are slow and stops entirely when they are busy.",
    },
    math: {
      title: "The math",
      steps: [
        "90 no-shows a quarter, and you currently contact none of them.",
        "If one in ten comes back and each is worth $400, that is nine.",
        "The list cost you nothing extra — you already paid to build it.",
      ],
      result: "About $3,600 a quarter, sitting in a list you already own.",
    },
    build: {
      title: "What we build",
      points: [
        "Everyone who goes quiet gets a follow-up that references what they came for",
        "It stops the moment they reply, book, or ask not to hear from you",
        "Nobody gets contacted twice by two different parts of the business",
        "You can see who is in the sequence and pull anyone out",
      ],
    },
    manual: {
      title: "What stays manual",
      body: "Anything that reads as a real conversation. We restart the contact; your team decides what to say once someone answers.",
      points: [
        "Replies to a follow-up",
        "Anyone who has complained before",
        "Accounts a person is already handling directly",
      ],
    },
    objections: [
      {
        q: "Isn't this just spam?",
        a: "It is if it is untargeted and never stops. These go to people who already raised their hand, reference the specific thing they wanted, and stop on any reply.",
      },
      {
        q: "We don't want to annoy customers.",
        a: "Then the sequence is short and the exit is easy. The risk of two well-timed messages is much smaller than the cost of never following up at all.",
      },
    ],
  },
  {
    slug: "reactivation",
    name: "Database reactivation",
    title: "Your best month is probably already sitting in your CRM.",
    symptom:
      "“We've got thousands of old contacts. I wouldn't know where to start.”",
    leak: {
      title: "Where the money leaks",
      body: "Every dormant contact cost money to acquire. That spend is already made and already booked. The list is not a marketing asset anymore because nobody has the hours to work it by hand.",
    },
    math: {
      title: "The math",
      steps: [
        "8,000 dormant contacts, and you work none of them.",
        "A conservative one percent response is 80 conversations.",
        "If a quarter of those convert at $600, that is $12,000.",
      ],
      result:
        "Out of a list that has been costing you storage and nothing else.",
    },
    build: {
      title: "What we build",
      points: [
        "The list gets segmented by what they actually did, not by when they signed up",
        "Contact goes out in batches your team can actually handle",
        "Duplicates and anyone who opted out are removed before anything sends",
        "Responses land in one queue with the history attached",
      ],
    },
    manual: {
      title: "What stays manual",
      body: "The volume control and the conversation. You decide how many replies a week your team can take, and your team takes them.",
      points: [
        "Setting the batch size",
        "Every conversation after the first response",
        "Deciding which segments are worth contacting at all",
      ],
    },
    objections: [
      {
        q: "These contacts are years old.",
        a: "Some are dead and the segmenting is what finds that out. The point of the first batch is to learn which parts of the list are still alive before spending anything on the rest.",
      },
      {
        q: "What about data protection?",
        a: "You only contact people whose basis for contact still holds, opt-outs are honoured before anything sends, and every send is logged. If the basis is not there, the segment does not go out.",
      },
    ],
  },
  {
    slug: "reporting",
    name: "Internal reporting",
    title: "Friday's report builds itself.",
    symptom:
      "“I get the numbers on Monday, and by then they're describing last week.”",
    leak: {
      title: "Where the money leaks",
      body: "The report is assembled by hand from several exports, so it is expensive to produce and late by the time it lands. Decisions get made on the version someone remembers rather than the one in front of them.",
    },
    math: {
      title: "The math",
      steps: [
        "Four hours every Friday, plus an hour of chasing the exports.",
        "At a loaded $40 an hour that is $200 a week.",
        "Over a year, 260 hours and $10,400 — for numbers that arrive stale.",
      ],
      result:
        "And the real cost is the decisions made without them, which nobody bills for.",
    },
    build: {
      title: "What we build",
      points: [
        "The numbers arrive already compiled, on the morning you want them",
        "One view across the sources instead of four exports to reconcile",
        "Anything that looks wrong is flagged rather than quietly averaged",
        "The same figures every time, so two people cannot bring different versions",
      ],
    },
    manual: {
      title: "What stays manual",
      body: "Reading it. We remove the assembly, not the judgment about what the numbers mean.",
      points: [
        "Deciding what to do about a number",
        "Anything that needs commentary or context",
        "Defining what counts as good, which is your call and changes",
      ],
    },
    objections: [
      {
        q: "Our data is a mess.",
        a: "Then the first deliverable is an honest picture of what you actually have. That is usually worth more than the report itself, and it is a finding rather than a blocker.",
      },
      {
        q: "We already have dashboards nobody looks at.",
        a: "Usually because they answer a question nobody asked. We start from the decision you make every week and build backwards to the numbers that decide it.",
      },
    ],
  },
] as const;

export function serviceBySlug(slug: string) {
  return services.find((service) => service.slug === slug);
}
