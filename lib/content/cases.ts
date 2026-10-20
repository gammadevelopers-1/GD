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
  /** Screenshots and mockups of the work. Empty until the visuals land. */
  gallery: readonly { src: string; caption: string }[];

  /** Three figures under the hero headline. */
  stats: readonly CaseStat[];

  about?: string;
  /** A wide banner under the heading. Optional: the section reads fine
   *  as prose, so it stays empty until real artwork exists. */
  leak?: { heading: string; body: readonly string[]; image?: string };
  /** Same optional banner as the leak, under the heading. */
  built?: { heading: string; items: readonly BuiltItem[]; image?: string };
  results?: {
    heading: string;
    lead: string;
    points: readonly ResultPoint[];
  };
  human?: string;
  takeaway?: { line: string; body: string };
  cta?: string;

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
    title: "Rental operators left Turo and launched their own brand in 40 seconds",
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
        { value: "3x", text: "more bookings in September than any month before" },
        { value: "4.4x", text: "growth in subscription revenue in 3 months" },
        { value: "$133k+", text: "processed for operators so far" },
        { value: "195", text: "vehicles and 540+ customers managed" },
        { value: "~12", text: "new operators joining every month" },
        { value: "9", text: "operators running their business on it for 6+ months" },
        {
          text: "The platform is now being rebuilt from the inside, one area at a time, **without a single live operator having to switch or notice**.",
        },
      ],
    },
    human:
      "Operators still set their prices, approve their customers and hand over the keys. AI flags identity mismatches and suggests prices and replies, but **the operator makes the call**. The platform does the paperwork. The owner runs the business.",
    takeaway: {
      line: "If your customers only know you through someone else's platform, you're building their brand, not yours.",
      body: "These operators didn't need another app. They needed one place to run the whole business, with **their own name on the front door**.",
    },
    cta: "Running your business across five tools and a phone? Let's find where it's leaking.",
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
    category: "Education and sports recruitment · Operations automation",
    title: "They outgrew ActiveCampaign, so we built a system they own",
    body: "A recruitment group placing young players into elite pathways, running on one system shaped around how they actually recruit.",
    tags: ["CRM", "Automation", "Payments"],
    image: "/case-study2.jpg",
    gallery: [],
    stats: [
      { value: "13,000+", label: "contacts on one system they own" },
      { value: "12", label: "automations running on their own rules" },
      { value: "~45 hrs", label: "of weekly spreadsheet work removed" },
    ],
    about:
      "A UK-based football education group that places ambitious young players into elite pathways: university programmes, gap years, residencies and training experiences with top European clubs. A team of 10+ recruiters guides each player from first enquiry to arrival, with programme fees around £10,000.",
    leak: {
      heading:
        "The business was running on ActiveCampaign and a pile of spreadsheets",
      body: [
        "Every player journey is long. Enquiry, first call, interview, application, offer, deposit, balance, paperwork, departure. Each step needs a message at the right time, and each one is a chance for a player to go quiet.",
        "The group ran all of this through ActiveCampaign. It is a capable marketing tool, but it is built for everyone, not for a business that recruits players into £10,000 programmes. They were paying roughly £2,500 a month for it, with large spreadsheets filling the gaps. The bill kept growing, they had little control over how things worked, and some of the steps their business needed simply did not exist in it. So the team did those by hand.",
        "The biggest gap was replies. When they sent a text campaign to thousands of past enquiries, answers came back as bare phone numbers. Someone had to open the spreadsheet, find who that number belonged to, and update their record manually. Warm players who had just said “yes, I'm interested” sat waiting while that happened.",
        "The team wasn't the problem. They were working hard to cover for a system that didn't fit how the business actually runs.",
      ],
    },
    built: {
      heading: "One system, built around how they recruit, that they own outright",
      items: [
        {
          label: "Leads",
          body: "Website forms, campaigns and recruiter entries from tournaments all land in one place. Every new player gets a recruiter assigned automatically and fairly, with no one managing the rota.",
        },
        {
          label: "Replies",
          body: "Every reply is matched to the right player automatically, even when it comes from a parent's phone or a slightly different name. AI then reads the reply, sorts it into interested, question or not now, and moves the player forward on its own.",
        },
        {
          label: "Follow-up",
          body: "12 automations handle the journey: follow-ups that stop the moment a player replies, interview reminders, confirmations, and pre-departure checklists. Each one runs on the group's own rules, including ones ActiveCampaign couldn't do.",
        },
        {
          label: "Payments",
          body: "Offers turn into deposit invoices automatically. Players can pay online, spread fees across a payment plan, and get a polite reminder if a payment is late. The reminder stops as soon as they pay.",
        },
        {
          label: "Players and parents",
          body: "Each enrolled player gets their own portal to see their balance, pay, and upload documents like passports, without emailing the office.",
        },
        {
          label: "Answers on demand",
          body: "Leadership can ask the system a plain question, like how many deposits came in this month for the gap year programme, and get the answer in seconds instead of building a spreadsheet.",
        },
        {
          label: "After hours",
          body: "An assistant on the website answers visitor questions and captures their details at any hour, so a 2am enquiry is waiting in the system by morning.",
        },
      ],
    },
    results: {
      heading: "From ActiveCampaign and spreadsheets to one system they control",
      lead: "The core platform went live in about 12 weeks, built by a team of three, and has been improved every month since. Every player, reply, invoice and document now lives in one place. Recruiters spend their time on calls with players instead of matching phone numbers in spreadsheets.",
      points: [
        { value: "13,000+", text: "contacts managed in one system" },
        {
          value: "~45 hrs/week",
          text: "of manual spreadsheet work removed, estimated across the recruiting team",
        },
        {
          value: "12",
          text: "automations covering the full journey, from first enquiry to departure day",
        },
        { value: "12 weeks", text: "from first line of code to the platform going live" },
      ],
    },
    human:
      "Recruiters still run every interview and make every offer decision. When the system isn't sure who a reply belongs to, it suggests a match with a confidence level and a person confirms it. Automation handles the typing. People handle the judgment.",
    takeaway: {
      line: "If your business runs on software you can't change, your process ends up shaped around the software.",
      body: "This group didn't need more tools. They needed one system shaped around how they already recruit, and the freedom to change it whenever the business does.",
    },
    cta: "Paying for software that doesn't fit how you work? Let's find where it's leaking.",
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
    category: "Private members' club · Membership CRM · AI agents",
    title: "Spreadsheets and WhatsApp groups became an AI chief of staff",
    body: "A luxury networking club where the founder held everything in her head, rebuilt as one system that briefs her every morning.",
    tags: ["Membership CRM", "AI agents", "Events"],
    image: "/case-study.jpg",
    gallery: [],
    stats: [
      { value: "1", label: "system replacing 5+ scattered tools" },
      { value: "3", label: "AI agents working for the founder daily" },
      { value: "~3 months", label: "from first meeting to live" },
    ],
    about:
      "A luxury private members' networking club in the North of England, bringing business owners together through curated events, retreats and introductions. Memberships range from £1,500 to £5,000 a year across three tiers. We built the full platform end to end: the public website, member portal, admin dashboard, staff workspace and sponsor portal.",
    leak: {
      heading: "A premium experience on the outside, chaos on the inside",
      body: [
        "Members saw a polished, high-end club. Behind it, the founder was running everything herself across Excel sheets, WhatsApp groups, Gmail and a separate lead tool. Applications in one place, payments in another, event lists in a spreadsheet, introductions in her head.",
        "Nothing talked to anything else. To answer a simple question like who is renewing next month, or which sponsor fits this event, she had to dig through five places and hope the information was current.",
        "The club was growing. The founder was the only thing holding it together, and that doesn't scale.",
      ],
    },
    built: {
      heading: "We started with her chaos, not with software",
      items: [
        {
          label: "One home for everything",
          body: "Members, applications, events, bookings, sponsors, finance and team, all on one database. Approve a member and they appear everywhere instantly.",
        },
        {
          label: "A luxury website that books for her",
          body: "Visitors browse events, apply to join and request places. Their card is held and only charged when she approves.",
        },
        {
          label: "An AI chief of staff",
          body: "Every morning at 7am, a briefing lands covering memberships, sales, events, team, finance and risks.",
        },
        {
          label: "A member success manager",
          body: "Flags members who are at risk, due to renew, going quiet, or ready to upgrade.",
        },
        {
          label: "A website concierge",
          body: "A luxury AI chat that answers visitors any time and turns them into qualified enquiries.",
        },
        {
          label: "Introductions that explain themselves",
          body: "Members get matched, and AI explains why the match makes sense, using what each member said they want and offer.",
        },
        {
          label: "A marketing engine in her voice",
          body: "One event, topic or voice note becomes blogs, LinkedIn posts, captions, newsletters and press releases, written in two voices: the club's and the founder's.",
        },
        {
          label: "Sponsors matched to the room",
          body: "AI matches sponsors to each event and its guest list, and drafts the outreach.",
        },
        {
          label: "A team that knows what it owns",
          body: "Tasks, scorecards, daily handovers and time tracking, with staff seeing only their own work.",
        },
        {
          label: "Every channel in one place",
          body: "Email, WhatsApp, contracts and payments, connected to accounting. Nothing customer-facing goes out without her approval.",
        },
      ],
    },
    results: {
      heading: "From holding everything in her head to a system that briefs her",
      lead: "The platform went live in about three months, and the founder and her team now run the club on it every day.",
      points: [
        {
          value: "5",
          text: "front doors on one database: website, member portal, admin, staff workspace and sponsor portal",
        },
        {
          value: "3",
          text: "AI agents running daily: chief of staff, member success and website concierge",
        },
        {
          value: "1",
          text: "system replacing spreadsheets, WhatsApp groups, inbox juggling and a separate lead tool",
        },
        { text: "Every workflow mapped out of the founder's head into a written spec." },
        { text: "A new public website that raised the bar on her previous one." },
      ],
    },
    human:
      "The founder still approves every member, every introduction and every message that leaves the club. AI writes the drafts, spots the risks and prepares the briefing. She makes the calls and builds the relationships, which is the part of the business only she can do.",
    takeaway: {
      line: "If your business only works because you remember everything, you don't have a system. You have a bottleneck.",
      body: "This founder didn't need more apps. She needed someone to map her chaos and turn it into one place that works the way she does.",
    },
    cta: "Running your business across spreadsheets and WhatsApp groups? Let's map where it's leaking.",
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
    category: "Legal services · Document AI · Multi-department platform",
    title: "They stopped retyping client IDs. AI reads them and fills the will.",
    body: "An estate planning firm in Dubai where every will began with someone copying an Emirates ID by hand, in two languages.",
    tags: ["Document AI", "Bilingual", "Multi-department"],
    image: "/case-study2.jpg",
    gallery: [],
    stats: [
      { value: "Seconds", label: "to pull ID details into a will" },
      { value: "AR + EN", label: "names captured from every ID" },
      { value: "4+", label: "departments running on one platform" },
    ],
    about:
      "An established wills and estate planning firm based in Dubai, serving clients across the UAE. A larger organisation with separate teams for will drafting, sales, HR and finance. We built the full platform end to end, in English and Arabic.",
    leak: {
      heading: "Every will started with someone retyping an ID card",
      body: [
        "A will is only as good as the details in it. Every client meant copying names, ID numbers and dates from an Emirates ID or passport into the will, often in both Arabic and English. One wrong letter in a name on a legal document means a redraft, a delay, and a client who loses confidence.",
        "Around that, each department ran on its own system. Sales tracked leads in one place, drafting in another, HR and finance somewhere else. Nobody had the full picture of a client, and clients had no way to see where their will was without calling the office.",
        "The team was careful. The process just made them do the same work twice, in two languages, across systems that didn't talk.",
      ],
    },
    built: {
      heading: "ID in, will out, and every department on one platform",
      items: [
        {
          label: "AI reads the ID",
          body: "Clients or staff upload an Emirates ID or passport. AI extracts the name in Arabic and English plus the ID details, and drops them straight into the will. If AI can't read it, a backup reader steps in.",
        },
        {
          label: "A guided will builder",
          body: "Beneficiaries, executors, guardians and assets captured step by step, in English or Arabic.",
        },
        {
          label: "Drafts generated automatically",
          body: "Court-ready wording produced as PDF and Word, watermarked until final.",
        },
        {
          label: "Every version kept",
          body: "Each draft is saved, so the firm can see exactly what changed and when.",
        },
        {
          label: "A portal for every client",
          body: "Clients log in, check their will's status, request changes and sign.",
        },
        {
          label: "Released when paid",
          body: "The final will is released only once payment clears, and executors are notified when needed.",
        },
        {
          label: "Sales in the same system",
          body: "Lead sources, salesperson assignment, call reminders, proposals with automatic follow-ups, and invoices with VAT.",
        },
        {
          label: "HR built in",
          body: "Attendance, leave approvals with delegation and escalation, monthly and quarterly KPI reviews, and employee documents with expiry alerts.",
        },
        {
          label: "Finance built in",
          body: "Transactions, receipts and a daily digest of outstanding balances, with daily backups of every will and record.",
        },
      ],
    },
    results: {
      heading: "From retyping IDs to a will that starts itself",
      lead: "The firm now runs drafting, sales, HR and finance from one record of each client, in both languages.",
      points: [
        {
          value: "Seconds",
          text: "for ID details to land in the will, in both languages, instead of being typed by hand",
        },
        {
          value: "1",
          text: "platform for drafting, sales, HR and finance, instead of separate systems per department",
        },
        { text: "Clients track their own will online, so fewer “where's my will?” calls." },
        { text: "Every draft versioned, and the final will released only when paid." },
        { text: "Delivered complete, end to end, in English and Arabic." },
      ],
    },
    human:
      "Lawyers still review every will before it's final. AI fills in the details, but people check the wording, meet the client and sign off. The system removes the retyping. The firm keeps the judgment.",
    takeaway: {
      line: "If your team retypes the same details twice, the mistake isn't a matter of if. It's when.",
      body: "This firm didn't need faster typists. It needed the ID to fill the will, and every department working from the same record.",
    },
    cta: "Still retyping documents into your system? Let's find where it's leaking.",
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
    category: "Healthcare education · eLearning platform · Saudi compliance",
    title: "Manual training became a government-approved eLearning platform",
    body: "Accredited CME courses for healthcare professionals, on a platform built so the regulator's rules are enforced automatically.",
    tags: ["eLearning", "Compliance", "Bilingual"],
    image: "/case-study.jpg",
    gallery: [],
    stats: [
      { value: "NELC", label: "approved by Saudi Arabia's National eLearning Center" },
      { value: "100+", label: "healthcare learners in the first 3 months" },
      { value: "5", label: "dashboards in Arabic and English" },
    ],
    about:
      "PhysioGuidance, by Roya Almustaqbal for Health Training, delivers accredited online and in-person courses with CME hours for healthcare professionals in Saudi Arabia. We built the full platform end to end: the public site, learner, instructor, course manager, admin and support dashboards, payments, live classes and the compliance layer.",
    leak: {
      heading: "Great courses, no platform, and a regulator to satisfy",
      body: [
        "PhysioGuidance had the instructors and the courses. What it didn't have was a system. Enrolments, attendance, certificates and payments were all handled by hand.",
        "That might work for a small in-person class. It doesn't work for online training in Saudi Arabia, where courses must meet the National eLearning Center's rules and healthcare learners need recognised CME hours. NELC checks things a spreadsheet can't prove: that attendance was tracked, that class sizes stayed within limits, that certificates are genuine, that the platform is accessible and secure.",
        "To launch online, PhysioGuidance didn't just need software. It needed software a regulator would approve.",
      ],
    },
    built: {
      heading: "A platform where the rules are built in, not bolted on",
      items: [
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
          body: "Course managers export the evidence NELC asks for, without chasing data.",
        },
        {
          label: "Certificates anyone can verify",
          body: "Every certificate carries a QR code that proves it's real.",
        },
        {
          label: "Feedback before certificates",
          body: "Learners review both the course and the instructor before their certificate unlocks, so quality data comes in on every course.",
        },
        {
          label: "Every video captioned automatically",
          body: "Uploaded lessons are processed and AI generates captions and transcripts.",
        },
        {
          label: "Learners rewarded for learning",
          body: "A points system rewards sign-ups, completed courses and reviews.",
        },
        {
          label: "A dashboard for every role",
          body: "Learner, instructor, course manager, admin and support, each seeing only what they should.",
        },
        {
          label: "Arabic and English throughout",
          body: "Accessible to WCAG 2.1 AA, with mada, Apple Pay, Visa and Mastercard for local payment.",
        },
        {
          label: "Security built for auditors",
          body: "Strong login protection, rate limits, upload malware scanning and a documented recovery plan.",
        },
      ],
    },
    results: {
      heading: "From manual training to an approved national platform",
      lead: "The platform passed Saudi Arabia's national eLearning review and is now the way PhysioGuidance teaches.",
      points: [
        { value: "NELC approved", text: "the platform passed the national eLearning review" },
        { value: "100+", text: "healthcare learners enrolled in the first 3 months after launch" },
        { value: "Zero", text: "manual attendance tracking: live class attendance syncs on its own" },
        { text: "Every certificate verifiable by QR code." },
        { text: "Every course video captioned without anyone typing." },
        { text: "Built end to end, from requirements to launch." },
      ],
    },
    human:
      "Instructors still teach every class and course managers still decide what gets published. The platform tracks attendance, enforces the rules and prepares the evidence. People do the teaching and make the calls.",
    takeaway: {
      line: "In a regulated market, the software isn't just a tool. It's your proof.",
      body: "PhysioGuidance didn't need an off-the-shelf course website. It needed a platform where every rule the regulator checks is already handled, so they could focus on teaching.",
    },
    cta: "Launching a training business in a regulated market? Let's map what your platform needs to prove.",
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
    image: "/case-study2.jpg",
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
    human:
      "Hiretics ranks and explains. Recruiters still read the shortlist, run the interviews and make the hire. The AI removes the hours of first-pass reading so people spend their time on the candidates who matter.",
    takeaway: {
      line: "Reading every CV isn't diligence. It's the job AI should be doing.",
      body: "We built Hiretics because hiring shouldn't cost small teams a fortune or good candidates their shot. It is also proof of how we work: we build AI products we would use ourselves.",
    },
    cta: "Want AI working inside your own hiring or operations? Let's talk.",
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
  cta: { label: "Book a call", note: "Free · 30 minutes · no preparation needed" },
} as const;
