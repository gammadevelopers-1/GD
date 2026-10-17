import { site } from "@/lib/content/site";

export const contactPage = {
  hero: {
    eyebrow: "Contact",
    heading: { one: "Tell us what's", two: "costing you." },
    lead: "This form asks more than most. That is deliberate — it means the first thing you hear back from us is about your business, not a link to a calendar.",
  },

  details: [
    {
      key: "email",
      label: "Email",
      value: site.email,
      href: `mailto:${site.email}`,
      note: "Goes to the same inbox as the form.",
      icon: "mail",
    },
    {
      key: "phone",
      label: "Phone",
      value: site.phone,
      href: site.phoneHref,
      note: "Pakistan time. Leave a message outside hours.",
      icon: "phone",
    },
    {
      key: "office",
      label: "Office",
      value: site.address.line1,
      href: null,
      note: site.address.line2,
      icon: "pin",
    },
  ],

  form: {
    heading: "Send an enquiry",
    lead: "Everything marked with an asterisk we need. The rest helps us come prepared.",
    groups: [
      {
        step: "01",
        title: "You",
        note: "So we know who we are writing back to.",
      },
      {
        step: "02",
        title: "Your company",
        note: "What we build depends on the size of the thing it runs inside.",
      },
      {
        step: "03",
        title: "The work",
        note: "The more specific this is, the more useful the first reply.",
      },
    ],
    labels: {
      firstName: "First name",
      lastName: "Last name",
      email: "Business email",
      phone: "Phone",
      company: "Company",
      country: "Country",
      roleTitle: "Your role",
      headcount: "Current headcount",
      revenue: "Annual revenue",
      stage: "Where you are",
      budget: "Budget for this",
      timeline: "Ideal timeline",
      summary: "What are you trying to solve?",
    },
    placeholders: {
      firstName: "Sara",
      lastName: "Malik",
      email: "you@company.com",
      phone: "Optional",
      company: "Cortek",
      country: "United Arab Emirates",
      summary:
        "Leads come in on WhatsApp overnight and get answered the next morning, if at all. Every booking gets retyped into two systems. Friday's report takes someone half a day.",
    },
    optional: "Optional",
    choose: "Choose one",
    freeMailNote:
      "A work address gets a faster answer — but send it from wherever you like.",
    submit: "Send the enquiry",
    sending: "Sending…",
    replyNote: site.replyTime,
    privacyNote: "We use this to reply to you. Nothing else.",
    success: {
      title: "That is with us.",
      body: "A person reads every one of these. You will hear back within one business day — from someone who has read what you wrote, not a template.",
      again: "Send another",
    },
    error: "Something went wrong at our end.",
  },

  closer: {
    heading: "Would rather just talk?",
    body: "Thirty minutes, no preparation needed. You leave with the plan whether or not you work with us.",
    cta: { label: "Book a call", href: site.book },
  },
} as const;
