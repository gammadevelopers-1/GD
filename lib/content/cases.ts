/**
 * Case studies.
 *
 * The shape here is deliberately the shape a CMS row will return: `status`,
 * `order` and the nested content blocks all map one-to-one onto columns, so
 * moving this to the database is a change of source, not of structure.
 *
 * Clients are anonymous unless they have agreed to be named. Only
 * PhysioGuidance has.
 */

export type CaseStat = { value: string; label: string };

/** A line in "What we built": a bold lead-in and the sentence after it. */
export type BuiltItem = { label: string; body: string };

/** A line in "Results". Some carry a figure, some are just a statement. */
export type ResultPoint = { value?: string; text: string };

export type CaseStudy = {
  slug: string;
  /** Only published studies are routed, listed or linked. */
  status: "published" | "draft";
  order: number;

  /** How the client is referred to on the page. */
  client: string;
  /** True when the client has agreed to be named. */
  named: boolean;
  sector: string;
  /** One word for the vertical, used by the footer's proof column. */
  vertical: string;
  region: string;
  /** Overrides the "Location" label on the about rail. Our own product has a
   *  status, not a place. */
  regionLabel?: string;
  /** Company of the testimonial that belongs to this client, matched against
   *  the wall in gamma-content. Only set it where the quote is genuinely from
   *  this engagement. */
  testimonial?: string;
  /** The line under the hero eyebrow, as written in the portfolio doc. */
  category: string;

  /** The headline. A problem turning into an outcome, never a company name. */
  title: string;
  /** Optional display treatment for the hero only: one entry per line, a
   *  quiet opener marked `small`, and `**stars**` on the words that go
   *  green. The hero falls back to `title` without it, and `title` is still
   *  what the card, the metadata and the next-case link use. */
  heroLines?: readonly { text: string; small?: boolean }[];
  /** Card summary. One sentence. */
  body: string;
  tags: readonly string[];

  /** Card artwork. */
  image: string;
  /** Optional mockup beside the hero headline. The hero stands on its own
   *  without one, so it stays empty until a real visual exists rather than
   *  being filled with stock. */
  heroImage?: string;
  /** Shape of the hero image box, as a CSS aspect-ratio. Artwork arrives in
   *  different crops, and forcing a panoramic composition into 16:9 cuts
   *  the ends off it. Defaults to 16 / 9. */
  heroAspect?: string;
  /** Screenshots and mockups of the work. Empty until the visuals land. */
  gallery: readonly { src: string; caption: string }[];

  /** Three figures under the hero headline. */
  stats: readonly CaseStat[];

  about?: string;
  /** A wide banner under the heading. Optional: the section reads fine
   *  as prose, so it stays empty until real artwork exists. */
  leak?: { heading: string; body: readonly string[]; image?: string };
  /** Same optional banner as the leak, under the heading. */
  built?: {
    heading: string;
    items: readonly BuiltItem[];
    image?: string;
    /** Shape of the banner box. Defaults to 2 / 1. */
    imageAspect?: string;
    /** Run the banner the full width under the heading instead of beside
     *  it. A wide, detailed scene needs the room; a squarer diagram reads
     *  better in the column next to the words. */
    imageFull?: boolean;
  };
  /** The AI layer, where there is enough of one to be worth its own
   *  section rather than a few lines inside "what we built". */
  ai?: {
    heading: string;
    lead?: string;
    items: readonly BuiltItem[];
    /** A banner between the lead and the items. */
    image?: string;
    /** Shape of that banner. Defaults to 2 / 1. */
    imageAspect?: string;
  };
  results?: {
    heading: string;
    lead: string;
    points: readonly ResultPoint[];
  };
  human?: string;
  /** Optional picture beside the "what's still human" copy. A sibling
   *  rather than a nested block, because `human` is a bare string. */
  humanImage?: string;
  /** Shape of that picture. Defaults to 16 / 9. */
  humanImageAspect?: string;
  takeaway?: { line: string; body: string };
  cta?: string;
  /** Optional background behind the closing call to action. It needs a
   *  quiet left half, because the copy sits there. */
  ctaImage?: string;

  nda?: boolean;
};

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: "car-rental-saas",
    testimonial: "Drive247",
    status: "published",
    order: 1,
    client: "A US car rental SaaS",
    named: false,
    sector: "Car rental",
    vertical: "Car Rental",
    region: "United States",
    category: "Car rental · Multi-tenant SaaS · AI operations",
    title:
      "Rental operators left Turo and launched their own brand in 40 seconds",
    heroLines: [
      { text: "They left Turo behind.", small: true },
      { text: "Their own brand," },
      { text: "live in **40 seconds**." },
    ],
    body: "A platform that gives independent operators their own booking site, fleet, insurance, agreements and payments in one place.",
    tags: ["Multi-tenant SaaS", "Payments", "AI operations"],
    image: "/casestudy-images/drive-cover.jpeg",
    heroImage: "/casestudy-images/drive-hero.jpeg",
    gallery: [],
    stats: [
      { value: "30+", label: "operators running their own brand" },
      { value: "$33k", label: "processed for operators in a month" },
      { value: "40 sec", label: "from signup to a live booking site" },
    ],
    about:
      "A US car rental software platform that gives independent operators **everything they need to run their own business**: a branded booking site, fleet management, insurance, agreements, payments and customer communication in one place. Operators range from budget fleets to luxury rentals. We designed, built and still run it end to end.",
    leak: {
      image: "/casestudy-images/drive-theleak.jpeg",
      heading:
        "Their business lived on someone else's marketplace and a phone full of notes",
      body: [
        "Most operators started on Turo. It got them their first customers, but it **never felt like their own business**. Customers saw Turo's brand, not theirs. Fees were high, support was slow, and they had no website and no customer list they truly owned.",
        "Behind the scenes, everything ran on a phone. Bookings in messages, details in notes, insurance arranged with a separate company before every rental, agreements signed on another platform, calls and texts on personal apps. Every tool worked alone. **None of them talked to each other.**",
        "That works at 3 cars. At 20, **the owner becomes the bottleneck**: copying the same details into four places, chasing signatures, checking insurance, and hoping nothing gets missed.",
        "The operators weren't disorganised. They were running a real business on **tools that were never built to work together**.",
      ],
    },
    built: {
      image: "/casestudy-images/drive-webuild.jpeg",
      heading: "One platform where every operator runs their own brand",
      items: [
        {
          label: "Their own website",
          body: "A branded booking site on their own address, editable in seconds without a developer.",
        },
        {
          label: "Live in 40 seconds",
          body: "Sign up and take bookings almost instantly.",
        },
        {
          label: "Insurance at checkout",
          body: "Customers buy rental cover while they book.",
        },
        {
          label: "Agreements signed online",
          body: "Part of the booking, not a separate platform.",
        },
        {
          label: "Know who's driving",
          body: "Customers upload ID, and AI checks the document and matches it to a selfie.",
        },
        {
          label: "Deposits that don't quietly disappear",
          body: "Card holds normally expire after 7 days. The platform renews them automatically, so operators are never left uncovered mid-rental.",
        },
        {
          label: "Payments handled",
          body: "Instalments, extensions and refunds inside the platform.",
        },
        {
          label: "Calls and messages in one inbox",
          body: "Every call and text sits with the booking it belongs to.",
        },
        {
          label: "Trax, an AI assistant for every operator",
          body: "Answers questions about the business, suggests customer replies, explains why a price was recommended, and writes a plain-English review of their money.",
        },
        {
          label: "Bring Turo bookings across",
          body: "Operators still on Turo can sync those bookings into one calendar.",
        },
      ],
    },
    results: {
      heading: "From a phone full of notes to a business they own",
      lead: "The first operator was taking real payments five weeks after the first line of code. Since then, the money operators process each month has grown from **$805 to $32,900**.",
      points: [
        { value: "~$76k", text: "ARR in under a year, from zero" },
        {
          value: "3x",
          text: "more bookings in September than any month before",
        },
        { value: "4.4x", text: "growth in subscription revenue in 3 months" },
        { value: "$133k+", text: "processed for operators so far" },
        { value: "195", text: "vehicles and 540+ customers managed" },
        { value: "~12", text: "new operators joining every month" },
        {
          value: "9",
          text: "operators running their business on it for 6+ months",
        },
        {
          text: "The platform is now being rebuilt from the inside, one area at a time, **without a single live operator having to switch or notice**.",
        },
      ],
    },
    humanImage: "/casestudy-images/drive-huma.jpeg",
    human:
      "Operators still set their prices, approve their customers and hand over the keys. AI flags identity mismatches and suggests prices and replies, but **the operator makes the call**. The platform does the paperwork. The owner runs the business.",
    takeaway: {
      line: "If your customers only know you through someone else's platform, you're building their brand, not yours.",
      body: "These operators didn't need another app. They needed one place to run the whole business, with **their own name on the front door**.",
    },
    cta: "Running your business across five tools and a phone? Let's find where it's leaking.",
    ctaImage: "/casestudy-images/drive-cta.jpeg",
  },

  {
    slug: "football-recruitment-platform",
    status: "published",
    order: 2,

    client: "A UK football education group",
    named: false,
    sector: "Education and sports recruitment",
    vertical: "Sports Recruitment",
    region: "United Kingdom",
    category:
      "Education and sports recruitment \u00b7 Workflow automation \u00b7 AI",

    title: "Their funnel runs itself, from first enquiry to paid invoice",
    heroLines: [
      {
        text: "183,000 leads. 50,000 emails a month.",
        small: true,
      },
      { text: "The funnel runs itself." },
      { text: "The bill dropped **80%**." },
    ],
    body: "A recruitment group whose leads, follow-up, email and invoicing now run themselves on one system they own.",
    tags: ["Workflow automation", "Agentic AI", "Payments"],

    image: "/casestudy-images/ifg-cover.jpeg",
    heroImage: "/casestudy-images/ifg-hero.jpeg",
    heroAspect: "21 / 9",
    gallery: [],

    stats: [
      { value: "80%", label: "cut from their monthly software bill" },
      { value: "50,000+", label: "emails a month across the whole team" },
      { value: "183,000", label: "leads on one system they own" },
    ],

    about:
      "A UK-based football education group that places ambitious young players into elite pathways: degree programmes run with a UK university partner, gap years, residencies and training experiences with top European clubs. A team of 10+ recruiters guides each lead from first enquiry to arrival, on programmes costing upwards of \u00a325,000. We designed, built and still run the platform it all moves through.",

    leak: {
      heading:
        "Their data sat on four platforms, and every stage waited for a person",
      body: [
        "Every player journey is long. Enquiry, first call, interview, application, offer, deposit, balance, paperwork, departure. Each step needs a message at the right time, and each one is a chance for a lead to go quiet.",
        "The work ran across ActiveCampaign, Publuu, Xero and a pile of spreadsheets. **Between $8,000 and $10,000 a month** left the business for tools that mostly just held their own data. None of them talked to each other, so a single lead was spread across four places and nobody could see all of it at once.",
        "Nothing moved on its own. A lead arrived and someone assigned it. An interview was booked and someone sent the confirmation. An offer went out and someone raised the invoice, watched for the payment, then chased it. **Every stage waited for a person to push it.**",
        "The biggest gap was replies. When they sent a campaign to thousands of past enquiries, answers came back as bare phone numbers. Someone had to open the spreadsheet, find who that number belonged to, and update the record by hand. Warm leads who had just said \u201cyes, I'm interested\u201d sat waiting while that happened.",
        "The team wasn't the problem. They were doing by hand the work the stack was being paid for and couldn't do.",
      ],
    },

    built: {
      image: "/casestudy-images/ifg-leak-fix.jpeg",
      imageAspect: "21 / 9",
      imageFull: true,
      heading: "One system where every stage triggers the next one",
      items: [
        {
          label: "A board the whole funnel moves across",
          body: "Every lead sits on a board by stage. Moving a card fires that stage's automation on its own: the email, the reminder, the task, the invoice. Nobody has to remember what comes next.",
        },
        {
          label: "Leads from everywhere, in one place",
          body: "Website forms, campaigns and recruiter entries from tournaments all land on the same board, and every new lead gets a recruiter assigned automatically and fairly, with no one managing a rota.",
        },
        {
          label: "Replies matched on their own",
          body: "Every reply finds the right lead automatically, even from a parent's phone or a slightly different name. AI reads it, sorts it into interested, question or not now, and moves the card forward.",
        },
        {
          label: "Outreach that keeps going",
          body: "Campaigns go out to past enquiries and the follow-up runs itself, stopping the moment someone replies.",
        },
        {
          label: "Invoices raised, sent and chased",
          body: "An offer becomes a deposit invoice without anyone opening an accounting tool. Leads pay online, spread fees across a plan, and get a polite reminder if a payment is late. The reminder stops as soon as they pay.",
        },
        {
          label: "Their platform, their data",
          body: "The public website and the system behind it are theirs. Contact records, email history and documents sit on their own infrastructure rather than inside four subscriptions.",
        },
        {
          label: "A portal for players and parents",
          body: "Each enrolled player gets their own portal to see their balance, pay, and upload documents like passports, without emailing the office.",
        },
      ],
    },

    ai: {
      image: "/casestudy-images/ifg-ai.jpeg",
      imageAspect: "21 / 9",
      heading: "An AI that doesn't just answer. It acts.",
      lead: "Two systems sit on top of the platform. One runs the business alongside the team. The other does the work nobody enjoys.",
      items: [
        {
          label: "Scout, for the people running it",
          body: "Super admins ask Scout about the business in plain English: how a programme is filling, what came in this month, where a lead has stalled. It answers from the live data rather than a report somebody had to build.",
        },
        {
          label: "Scout can act, not only answer",
          body: "Ask it to raise a $5,000 invoice for a programme and email it to a lead, create a contact, or move a card to the next stage, and it does it. The instruction is a sentence, not a form.",
        },
        {
          label: "The same agent, facing the public",
          body: "Scout also sits on the public site, where students and parents ask about programmes, fees and entry routes. It answers out of a maintained knowledge base of the group's own material, retrieved and quoted rather than recalled, so it isn't guessing.",
        },
        {
          label: "An agent that designs the email, not just writes it",
          body: "Describe the email and the agent produces it finished: the copy, the fonts, the colours, the background and the pattern work. The team sends a designed email without opening a template builder.",
        },
      ],
    },

    results: {
      heading: "The work that needed a person now needs a trigger",
      lead: "The core platform went live in about 12 weeks, built by a team of three, and has been improved every month since. More than 50,000 emails a month move through it across every recruiter, and the stack it replaced was costing **$8,000 to $10,000 a month**.",
      points: [
        { value: "80%", text: "cut from the monthly software bill" },
        {
          value: "50,000+",
          text: "emails a month sent and received across the team",
        },
        { value: "183,000", text: "leads managed in one system they own" },
        {
          value: "~45 hrs/week",
          text: "of manual spreadsheet work removed, estimated across the recruiting team",
        },
        {
          value: "12",
          text: "automations covering the full journey, from first enquiry to departure day",
        },
        {
          value: "12 weeks",
          text: "from first line of code to the platform going live",
        },
        {
          text: "Invoices are raised, sent and chased without anyone opening an accounting tool, and the chase stops the moment a lead pays.",
        },
      ],
    },

    humanImage: "/casestudy-images/ifg-huma.jpeg",
    humanImageAspect: "21 / 9",
    human:
      "Recruiters still run every interview and make every offer decision. When the system isn't sure who a reply belongs to, it suggests a match with a confidence level and a person confirms it. **Automation handles the typing. People handle the judgment.**",

    takeaway: {
      line: "If every stage of your funnel waits for a person, you don't have a system. You have a to-do list.",
      body: "This group didn't need more tools. They needed the work to move on its own, and the record of it to live somewhere **they own**.",
    },

    cta: "Still pushing every lead through by hand? Let's find where it's leaking.",
    ctaImage: "/casestudy-images/ifg-cta.jpeg",
  },

  {
    slug: "members-club-platform",
    status: "published",
    order: 3,

    client: "A UK private members' club",
    named: false,
    sector: "Private members' club",
    vertical: "Members' Clubs",
    region: "United Kingdom",
    category:
      "Private members' club \u00b7 Workflow automation \u00b7 AI agents",

    title: "Seven AI agents run the club. She runs the room.",
    heroLines: [
      {
        text: "A chief of staff, a receptionist and a matchmaker.",
        small: true,
      },
      { text: "Seven agents run the club." },
      { text: "**She runs the room.**" },
    ],
    body: "A luxury networking club across three cities where a chief of staff, a receptionist and a matchmaker keep the day running, and none of them are people.",
    tags: ["AI agents", "Workflow automation", "Events"],

    image: "/casestudy-images/club-cover.jpeg",
    heroImage: "/casestudy-images/club-hero.jpeg",
    heroAspect: "21 / 9",
    gallery: [],

    stats: [
      { value: "7", label: "AI agents running the club day to day" },
      { value: "150+", label: "members across London, Manchester and Leeds" },
      { value: "~3 months", label: "from first meeting to live" },
    ],

    about:
      "A luxury private members' networking club bringing business owners together across London, Manchester and Leeds through curated events, retreats and introductions. Memberships run from \u00a31,500 to \u00a35,000 a year across three tiers, with 150+ members. We built the platform end to end \u2014 the public website, member dashboards, admin, staff workspace and sponsor portal \u2014 and still run it.",

    leak: {
      heading:
        "The next thing she needed was a manager, and she didn't want one",
      body: [
        "Members saw a polished, high-end club. Behind it, the founder was running all of it herself across Excel sheets, WhatsApp groups, Gmail and a separate lead tool. Applications in one place, payments in another, event lists in a spreadsheet, introductions in her head.",
        "Nothing talked to anything else. To answer a simple question \u2014 who is renewing next month, which sponsor fits this event \u2014 she had to dig through five places and hope what she found was current, while **a stack of third-party tools took money every month to hold data she already owned**.",
        "None of the day to day moved on its own either. Renewal invoices, failed payments, post-event follow-ups, guest nurture, introduction notes: every one of them waited for her to remember.",
        "The obvious answer was to hire. Someone to hold the diary, chase the money and brief her each morning. **She didn't want a manager. She wanted the job done.**",
      ],
    },

    built: {
      image: "/casestudy-images/club-leak-fix.jpeg",
      imageAspect: "21 / 9",
      imageFull: true,
      heading: "One system, and a day that runs without her",
      items: [
        {
          label: "One home for everything",
          body: "Members, applications, events, bookings, sponsors, finance and team on one database. Approve a member and they appear everywhere instantly.",
        },
        {
          label: "A luxury website that books for her",
          body: "Visitors browse events, apply to join and request places. Their card is held and only charged once she approves.",
        },
        {
          label: "Lifecycle emails that send themselves",
          body: "Renewal reminders, failed-payment notices, post-event follow-ups, guest nurture, invoice chasing and introduction notifications all run on a daily schedule. She can preview or trigger any of them, but none of them wait for her.",
        },
        {
          label: "Renewals invoiced automatically",
          body: "A membership coming up for renewal raises and sends its own invoice, and chases it if it goes unpaid.",
        },
        {
          label: "A dashboard for every member",
          body: "Members see their membership, their events, their bookings and their introductions without emailing the office.",
        },
        {
          label: "Sponsors matched to the room",
          body: "Each event's guest list is matched against the sponsor list, and the outreach is drafted ready to send.",
        },
        {
          label: "A team that knows what it owns",
          body: "Tasks, scorecards, daily handovers and time tracking, with staff seeing only their own work.",
        },
        {
          label: "Every channel in one place",
          body: "Email, WhatsApp, contracts and payments, connected to accounting. Nothing customer-facing leaves without her approval.",
        },
      ],
    },

    ai: {
      image: "/casestudy-images/club-ai.jpeg",
      imageAspect: "21 / 9",
      heading: "Seven agents, each with a piece of the day",
      lead: "The management job she was about to hire for is split across seven systems. Each one does a piece of it, every day.",
      items: [
        {
          label: "Chief of Staff",
          body: "Every morning at 7am a briefing lands covering memberships, sales, events, team, finance and risks. Every figure is read off live data rather than a report somebody had to build.",
        },
        {
          label: "A receptionist that answers the phone",
          body: "Takes the call in place of a human receptionist, talks to the caller, and books the meeting, the event place or the seat they were ringing about.",
        },
        {
          label: "Member Success",
          body: "Watches the membership for anyone going quiet, coming up for renewal, at risk of leaving or ready to upgrade, and flags them earlier than a person scanning a spreadsheet would.",
        },
        {
          label: "Introductions that know why",
          body: "The founder's whole idea was spotting what two members have in common. AI reads what each one said they want and offer, finds the overlap, and explains the match so she can make the introduction at the next event.",
        },
        {
          label: "A concierge on the website",
          body: "Answers visitors at any hour and turns them into qualified enquiries instead of a form nobody fills in.",
        },
        {
          label: "An agent that designs the email",
          body: "Describe the email and it comes back finished: the copy, the layout, the colours and the type, rather than a blank template builder.",
        },
        {
          label: "Marketing that posts itself",
          body: "One event, topic or voice note becomes blogs, LinkedIn posts, captions and newsletters in two voices, the club's and the founder's, then goes out on a schedule through Metricool.",
        },
      ],
    },

    results: {
      heading: "The admin runs on agents. She runs the relationships.",
      lead: "The platform went live in about three months and the club has run on it every day since, now across three cities with 150+ members \u2014 and **the manager she was about to hire was never needed**.",
      points: [
        {
          value: "7",
          text: "AI agents covering the briefing, the phone, the matching and the marketing",
        },
        {
          value: "7am",
          text: "daily briefing on memberships, sales, events, team, finance and risks",
        },
        { value: "150+", text: "members across London, Manchester and Leeds" },
        {
          value: "5",
          text: "front doors on one database: website, member dashboards, admin, staff workspace and sponsor portal",
        },
        {
          value: "3",
          text: "membership tiers, invoiced and renewed on their own",
        },
        { value: "~3 months", text: "from first meeting to live" },
        {
          text: "Renewals, failed payments, follow-ups, nurture and introduction notices all send on a daily schedule without anyone starting them.",
        },
      ],
    },

    humanImage: "/casestudy-images/club-human.jpeg",
    human:
      "The founder still approves every member, every introduction and every message that leaves the club. AI writes the drafts, spots the risks, answers the phone and prepares the briefing. **She makes the calls and builds the relationships**, which is the part of the business only she can do.",

    takeaway: {
      line: "The job you are about to hire for is usually a description of work nobody has automated yet.",
      body: "This founder didn't need more apps, and she didn't need a manager. She needed the day to run itself, and to keep **the part only she can do**.",
    },

    cta: "About to hire someone to hold it all together? Let's find where it's leaking.",
    ctaImage: "/casestudy-images/club-cta.jpeg",
  },

  {
    slug: "wills-firm-document-ai",
    testimonial: "Just Wills",
    status: "published",
    order: 4,

    client: "A UAE wills firm",
    named: false,
    sector: "Legal services",
    vertical: "Legal",
    region: "United Arab Emirates",
    category:
      "Legal services \u00b7 Document AI \u00b7 Multi-department platform",

    title:
      "They stopped retyping client IDs. AI reads them and fills the will.",
    body: "An estate planning firm in Dubai where every will began with someone copying an Emirates ID by hand, in two languages.",
    tags: ["Document AI", "Bilingual", "Multi-department"],

    image: "/casestudy-images/will-cover.jpeg",
    heroImage: "/casestudy-images/will-hero.jpeg",
    heroAspect: "21 / 9",
    gallery: [],

    stats: [
      { value: "7", label: "roles on one platform, super admin down to HR" },
      { value: "4", label: "departments working from one client record" },
      {
        value: "Seconds",
        label: "for an ID to fill a will, in both languages",
      },
    ],

    about:
      "An established wills and estate planning firm based in Dubai, serving clients across the UAE. A larger organisation with separate teams for will drafting, sales, HR and finance, and seven roles on the platform from super admin down to marketing. We built it end to end, in English and Arabic, and still run it.",

    leak: {
      heading: "Every will started with someone retyping an ID card",
      body: [
        "A will is only as good as the details in it. Every client meant copying names, ID numbers and dates from an Emirates ID or passport into the will, often in both Arabic and English. **One wrong letter in a name on a legal document** means a redraft, a delay, and a client who loses confidence.",
        "Writing the document was manual too. The firm's drafting rules lived in people's heads and in old files, so every will was assembled by hand from a template somebody had to find first.",
        "Around that, each department ran on its own system. Sales tracked leads in one place, drafting in another, HR and finance somewhere else. Mail about a client sat in whoever's inbox it arrived in. Nobody had the full picture, and clients had no way to see where their will was without calling the office.",
        "The team was careful. The process just made them do the same work twice, in two languages, across systems that didn't talk.",
      ],
    },

    built: {
      image: "/casestudy-images/will-leak-fix.jpeg",
      imageAspect: "21 / 9",
      imageFull: true,
      heading: "ID in, will out, and every department on one platform",
      items: [
        {
          label: "AI reads the ID",
          body: "Clients or staff upload an Emirates ID or passport. AI extracts the name in Arabic and English plus the ID details, and drops them straight into the will. If it can't read the document, a second reader steps in rather than handing the job back to a person.",
        },
        {
          label: "AI writes the document",
          body: "The firm's drafting rules are baked into the system. Give it a client's details and it produces the will or the agreement in court-ready wording, then sends it to the person who applied, without anyone finding a template first.",
        },
        {
          label: "A guided will builder",
          body: "Beneficiaries, executors, guardians and assets captured step by step, in English or Arabic.",
        },
        {
          label: "PDF and Word, watermarked until final",
          body: "Every draft comes out in both formats and stays watermarked until the will is signed off.",
        },
        {
          label: "Every version kept",
          body: "Each draft is saved, so the firm can see exactly what changed and when.",
        },
        {
          label: "A portal for every client",
          body: "Clients log in, check their will's status, request changes and sign, instead of ringing the office to ask.",
        },
        {
          label: "Released when paid",
          body: "The final will is released only once payment clears, and executors are notified when needed.",
        },
        {
          label: "Leads on a funnel, not a list",
          body: "Enquiries land with a source, get assigned to a salesperson, and move through the stages on their own: call reminders, proposals, automatic follow-ups, then invoices with VAT.",
        },
        {
          label: "Everyone's own Outlook, in one place",
          body: "Each member of the team connects their own Outlook, so the mail about a client sits with that client's record instead of in a personal inbox.",
        },
        {
          label: "Seven roles, each seeing their own",
          body: "Super admin, HR, lead owners, marketing and the drafting team each get the part of the platform that belongs to them, and nothing else.",
        },
        {
          label: "HR built in",
          body: "Attendance, leave approvals with delegation and escalation, monthly and quarterly KPI reviews, and employee documents with expiry alerts.",
        },
        {
          label: "Finance and backups",
          body: "Transactions, receipts and a daily digest of outstanding balances, with every will and record backed up daily.",
        },
      ],
    },

    results: {
      heading: "From retyping IDs to a will that writes itself",
      lead: "The firm runs drafting, sales, HR and finance from **one record of each client**, in both languages, with every role seeing only the part that belongs to it.",
      points: [
        {
          value: "Seconds",
          text: "for ID details to land in the will, in both languages, instead of being typed by hand",
        },
        {
          value: "7",
          text: "roles on one platform: super admin, HR, lead owners, marketing and the drafting team among them",
        },
        {
          value: "4",
          text: "departments working from one record instead of a system each",
        },
        {
          text: "Wills and agreements are written from the firm's own drafting rules and sent to the applicant without anyone opening a template.",
        },
        {
          text: "English and Arabic run through every screen and every document, rather than a translation bolted on at the end.",
        },
        {
          text: "Clients track their own will online, and the final will is released only once payment clears.",
        },
      ],
    },

    humanImage: "/casestudy-images/will-human.jpeg",
    humanImageAspect: "2 / 1",
    human:
      "Lawyers still review every will before it is final. AI reads the ID and writes the draft from the firm's own rules, but a person checks the wording, meets the client and signs off. **The system removes the retyping. The firm keeps the judgment.**",

    takeaway: {
      line: "If your team retypes the same details twice, the mistake isn't a matter of if. It's when.",
      body: "This firm didn't need faster typists. It needed **the ID to fill the will**, the rules to write it, and every department working from the same record.",
    },

    cta: "Still retyping documents into your system? Let's find where it's leaking.",
    ctaImage: "/casestudy-images/will-cta.jpeg",
  },

  {
    slug: "physioguidance",
    testimonial: "PhysioGuidance",
    status: "published",
    order: 5,

    client: "PhysioGuidance",
    named: true,
    sector: "Healthcare education",
    vertical: "Healthcare Training",
    region: "Saudi Arabia",
    category:
      "Healthcare education \u00b7 E-learning SaaS \u00b7 Saudi compliance",

    title: "Manual training became a government-approved e-learning platform",
    heroLines: [
      {
        text: "1,000+ healthcare professionals across Saudi Arabia.",
        small: true,
      },
      { text: "A national regulator" },
      { text: "**approved the platform.**" },
    ],
    body: "Accredited CME courses for healthcare professionals, on a platform built so the regulator's rules are enforced automatically.",
    tags: ["E-learning", "Compliance", "Bilingual"],

    image: "/casestudy-images/physio-cover.jpeg",
    heroImage: "/casestudy-images/physio-hero.jpeg",
    heroAspect: "21 / 9",
    gallery: [],

    stats: [
      { value: "1,000+", label: "healthcare professionals learning on it" },
      {
        value: "NELC",
        label: "approved by Saudi Arabia's national e-learning regulator",
      },
      { value: "7", label: "roles on the platform, in Arabic and English" },
    ],

    about:
      "PhysioGuidance, by Roya Almustaqbal for Health Training, delivers accredited online and in-person courses with CME hours for healthcare professionals in Saudi Arabia, with more than 1,000 learners on the platform. We built the whole product end to end \u2014 the public site, seven roles from learner to finance, every local way to pay, live classes, support, and a compliance layer answering to both NELC and the national data protection law \u2014 and still run it.",

    leak: {
      heading: "Great courses, no platform, and a regulator to satisfy",
      body: [
        "PhysioGuidance had the instructors and the courses. What it didn't have was a system. Enrolments, attendance, certificates and payments were all handled by hand.",
        "That might work for a small in-person class. It doesn't work for online training in Saudi Arabia, where courses must meet the National eLearning Center's rules and healthcare learners need recognised CME hours. NELC checks things a spreadsheet can't prove: that attendance was tracked, that class sizes stayed within limits, that certificates are genuine, that the platform is accessible and secure.",
        "Producing the courses was slow as well. Turning study material into a lesson, then captioning it so learners in more than one language could follow, was work somebody did by hand for every module.",
        "And NELC is not the only authority involved. Any platform holding Saudi citizens' records answers to the Personal Data Protection Law as well, which the Saudi Data and Artificial Intelligence Authority administers.",
        "To launch online, PhysioGuidance didn't just need software. **It needed software a regulator would approve.**",
      ],
    },

    built: {
      image: "/casestudy-images/physio-leak-fix.jpeg",
      imageAspect: "21 / 9",
      imageFull: true,
      heading: "A platform where the rules are built in, not bolted on",
      items: [
        {
          label: "Lessons made from the study material",
          body: "Give the AI the course content and it produces the lesson video, then the transcript and captions for it in several languages, instead of someone recording and subtitling every module by hand.",
        },
        {
          label: "Live classes that track themselves",
          body: "Zoom sessions are built in, attendance syncs automatically, and the 70% minimum is enforced before a learner can complete.",
        },
        {
          label: "Class limits handled for you",
          body: "Class sizes stay within NELC limits, and assistants are allocated automatically when a class grows.",
        },
        {
          label: "Audit evidence on demand",
          body: "Course managers export the evidence the regulator asks for, without chasing data.",
        },
        {
          label: "Certificates anyone can verify",
          body: "Every certificate carries a QR code that proves it is real.",
        },
        {
          label: "Feedback before certificates",
          body: "Learners review both the course and the instructor before their certificate unlocks, so quality data comes in on every course.",
        },
        {
          label: "Every way Saudi pays",
          body: "mada, Visa and Mastercard, plus Apple Pay, Google Pay and Samsung Pay, all running through Moyasar.",
        },
        {
          label: "Course fees in instalments",
          body: "Learners split a fee with Tabby or Tamara, and their place is confirmed the moment the provider approves it.",
        },
        {
          label: "Bank transfers approved in the platform",
          body: "A learner paying by transfer uploads the proof and finance approves or rejects it without anyone leaving the system or chasing a statement.",
        },
        {
          label: "Refunds, whole or partial",
          body: "Finance issues a full or partial refund and the learner's enrolment follows it automatically, rather than being corrected by hand afterwards.",
        },
        {
          label: "Support with a queue, not an inbox",
          body: "Learners and staff raise tickets, and the support team works them in a dashboard of their own rather than in somebody's email.",
        },
        {
          label: "The team talks inside the platform",
          body: "Instructors, course managers and support message each other where the work is, rather than in a separate chat tool.",
        },
        {
          label: "Learners rewarded for learning",
          body: "A points system rewards sign-ups, completed courses and reviews.",
        },
        {
          label: "Seven roles, each seeing their own",
          body: "Learner, instructor, course manager, admin, support and finance, each with the part of the platform that belongs to them and nothing else.",
        },
        {
          label: "Arabic and English throughout",
          body: "Every screen, every document and every certificate, accessible to WCAG 2.1 AA.",
        },
        {
          label: "Built to the data law, not just the course rules",
          body: "The platform is built to comply with Saudi Arabia's Personal Data Protection Law, administered by the Saudi Data and Artificial Intelligence Authority (SDAIA), alongside the NELC rules that govern the courses themselves.",
        },
        {
          label: "Security built for auditors",
          body: "Strong login protection, rate limits, upload malware scanning and a documented recovery plan.",
        },
      ],
    },

    results: {
      heading: "From manual training to an approved national platform",
      lead: "The platform passed Saudi Arabia's national e-learning review and is now the way PhysioGuidance teaches, with **more than a thousand healthcare professionals** learning on it.",
      points: [
        {
          value: "1,000+",
          text: "healthcare professionals learning on the platform",
        },
        {
          value: "NELC",
          text: "approved: the platform passed the national e-learning review",
        },
        {
          value: "PDPL",
          text: "built to Saudi Arabia's data protection law, administered by SDAIA",
        },
        {
          value: "7",
          text: "role dashboards, each seeing only what belongs to it",
        },
        {
          value: "Zero",
          text: "manual attendance tracking: live class attendance syncs on its own",
        },
        {
          value: "9",
          text: "ways to pay: mada, Visa, Mastercard, Apple Pay, Google Pay, Samsung Pay, Tabby, Tamara and bank transfer",
        },
        {
          text: "Lesson videos, transcripts and captions are produced from the study material, in several languages, without anyone recording or subtitling by hand.",
        },
        { text: "Every certificate is verifiable by QR code." },
        {
          text: "Support runs on a ticket queue and the team talks inside the platform, not around it.",
        },
      ],
    },

    humanImage: "/casestudy-images/physio-human.jpeg",
    humanImageAspect: "2 / 1",
    human:
      "Instructors still teach every class and course managers still decide what gets published. The platform tracks attendance, enforces the rules, makes the lessons and prepares the evidence. **People do the teaching and make the calls.**",

    takeaway: {
      line: "In a regulated market, the software isn't just a tool. It's your proof.",
      body: "PhysioGuidance didn't need an off-the-shelf course website. It needed a platform where **every rule the regulator checks is already handled**, so they could focus on teaching.",
    },

    cta: "Building in a regulated market? Let's map what your platform has to prove.",
    ctaImage: "/casestudy-images/physio-cta.jpeg",
  },

  {
    slug: "hiretics",
    status: "published",
    order: 6,
    client: "Gamma Developers",
    named: true,
    sector: "Recruitment and HR tech",
    vertical: "Hiring",
    region: "Live beta",
    regionLabel: "Status",
    category: "Our own product · AI recruitment · Serverless SaaS",
    title: "From a pile of CVs to a ranked shortlist in seconds",
    body: "Our own AI hiring platform. Recruiters get a live, ranked shortlist with a written reason for every score.",
    tags: ["AI scoring", "Pay per CV", "Live beta"],
    image: "/casestudy-images/hire-cover.jpeg",
    heroImage: "/casestudy-images/hire-hero.jpeg",
    heroAspect: "21 / 9",
    gallery: [],
    stats: [
      { value: "97%", label: "ranking accuracy in testing" },
      { value: "Seconds", label: "to score a CV, not hours" },
      { value: "$0.26", label: "per CV at scale, no subscription" },
    ],
    about:
      "Hiretics is our own AI hiring platform. Recruiters post a role and get a live, ranked shortlist with a written reason for every score. Candidates upload a CV and get a career report showing exactly how to improve. It started as our founder's final year project and is now live in beta.",
    leak: {
      heading: "Hiring is slow, expensive and unfair to good candidates",
      body: [
        "A single job post can pull in hundreds of CVs. Reading them properly takes hours a role. So most teams either skim and miss great people, or lean on keyword filters that reject qualified candidates and reward whoever stuffs the right words in.",
        "The tools that do this well are built for big enterprises, with big monthly fees, whether you hire once a year or every week. Small businesses and agencies are left choosing between paying too much and reading every CV by hand.",
        "And candidates get nothing back. No idea why they were rejected, or how to do better next time.",
      ],
    },
    built: {
      image: "/casestudy-images/hire-leak-fix.jpeg",
      imageAspect: "21 / 9",
      imageFull: true,
      heading: "AI that reads every CV like a recruiter, and explains itself",
      items: [
        {
          label: "AI writes the job post",
          body: "Describe the role, and AI drafts the title, description and weighted scoring criteria. Edit anything.",
        },
        {
          label: "Every CV scored and explained",
          body: "Each CV gets a 0 to 100 score against your criteria, with a written reason. No black box.",
        },
        {
          label: "A shortlist that ranks itself",
          body: "Scores appear live on your dashboard as CVs come in.",
        },
        {
          label: "Pay per CV, not per month",
          body: "Buy credits when you hire, nothing when you don't. Credits never expire.",
        },
        {
          label: "Hiring insights",
          body: "Education, location and diversity views across your applicants.",
        },
        {
          label: "A public job board",
          body: "Published roles become public listings with one-click apply.",
        },
        {
          label: "A career coach for candidates",
          body: "Upload a CV and get a report with skill gaps, career pivots, line-by-line edits and a 30-60-90 day plan, then track improvement across versions.",
        },
        {
          label: "Built to scale to zero",
          body: "It costs almost nothing when idle and handles a flood of CVs without slowing down. If a CV fails, it is retried, never lost.",
        },
      ],
    },
    results: {
      heading: "Live in beta, already ranking with 97% accuracy",
      lead: "It went from a final year project to a working product, built end to end by us.",
      points: [
        { value: "97%", text: "ranking accuracy in testing" },
        { value: "Seconds", text: "per CV instead of hours of manual reading" },
        { value: "$0.26", text: "per CV at scale, with no subscription" },
        {
          text: "Two products on one platform: recruiter screening and candidate career coaching.",
        },
      ],
    },
    humanImage: "/casestudy-images/hire-human.jpeg",
    humanImageAspect: "2 / 1",
    human:
      "Hiretics ranks and explains. Recruiters still read the shortlist, run the interviews and make the hire. The AI removes the hours of first-pass reading so people spend their time on the candidates who matter.",
    takeaway: {
      line: "Reading every CV isn't diligence. It's the job AI should be doing.",
      body: "We built Hiretics because hiring shouldn't cost small teams a fortune or good candidates their shot. It is also proof of how we work: we build AI products we would use ourselves.",
    },
    cta: "Want AI working inside your own hiring or operations? Let's talk.",
    ctaImage: "/casestudy-images/hire-cta.jpeg",
  },

  // Written before the portfolio rewrite and not yet brought up to the same
  // standard, so they are not routed or listed. The content is kept here so
  // nothing is lost when these move into the CMS.
  {
    slug: "d360-bank",
    status: "draft",
    order: 7,
    client: "A Saudi digital bank",
    named: false,
    sector: "Banking",
    vertical: "Banking",
    region: "Saudi Arabia",
    category: "Banking · Regulated engineering",
    title: "Auditability as a precondition, not a feature",
    body: "Engineering inside a regulated bank, where every decision the software makes has to be explainable afterwards.",
    tags: ["Banking", "Compliance"],
    image: "/case-study.jpg",
    gallery: [],
    stats: [],
    nda: true,
  },
  {
    slug: "vidacure",
    status: "draft",
    order: 8,
    client: "A Swedish health platform",
    named: false,
    sector: "HealthTech",
    vertical: "Healthcare",
    region: "Sweden",
    category: "HealthTech · Patient operations",
    title: "Bookings that stop being typed twice",
    body: "A clinic platform where the front desk was re-entering every appointment into a second system.",
    tags: ["HealthTech", "Bookings"],
    image: "/case-study2.jpg",
    gallery: [],
    stats: [],
    nda: true,
  },
  {
    slug: "meter",
    status: "draft",
    order: 9,
    client: "An energy operator",
    named: false,
    sector: "Energy",
    vertical: "Energy",
    region: "GCC",
    category: "Energy · Field operations",
    title: "Readings that arrive without a clipboard",
    body: "Field data that used to come back on paper, arriving in the system the moment it is captured.",
    tags: ["Energy", "Field ops"],
    image: "/case-study.jpg",
    gallery: [],
    stats: [],
    nda: true,
  },
];

/** Everything the public site is allowed to show, in display order. */
export const publishedCases = caseStudies
  .filter((item) => item.status === "published")
  .toSorted((a, b) => a.order - b.order);

export function caseBySlug(slug: string) {
  return publishedCases.find((item) => item.slug === slug);
}

/** The one after this one, wrapping at the end. */
export function nextCase(slug: string) {
  const at = publishedCases.findIndex((item) => item.slug === slug);
  if (at < 0) return undefined;
  return publishedCases[(at + 1) % publishedCases.length];
}

export const workIndex = {
  eyebrow: "Case studies",
  heading: { one: "Our work", two: "speaks for itself." },
  lead: "A selection of what is live with clients today. Where a client is under an agreement we describe the shape of the work rather than the detail.",
  cta: {
    label: "Let’s discuss yours",
    note: "Free · 30 minutes · the plan is yours either way",
  },
  last: {
    heading: "Yours could be next.",
    body: "Thirty minutes on a call and you will know whether there is anything here worth building.",
    label: "Start here",
  },
} as const;

/** Section labels for the detail page. */
export const caseLabels = {
  about: "About",
  leak: "The leak",
  built: "What we built",
  ai: "The AI layer",
  results: "Results",
  human: "What's still human",
  takeaway: "Takeaway",
  gallery: "Inside the build",
  testimonial: "In their words",
  industry: "Industry",
  location: "Location",
  builtBy: "Built by",
  next: "Next case study",
  back: "All case studies",
  cta: {
    label: "Book a call",
    note: "Free · 30 minutes · no preparation needed",
  },
} as const;
