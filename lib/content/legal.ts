import { site } from "@/lib/content/site";

export type LegalSection = {
  heading: string;
  body: readonly string[];
};

export type LegalDocument = {
  slug: string;
  title: string;
  updated: string;
  intro: string;
  sections: readonly LegalSection[];
};

/**
 * Written to describe what this site actually does, not what a template
 * assumes. Every processor named here is one the code calls, and every
 * collection point is a form or route that exists.
 *
 * Not legal advice, and not reviewed by a lawyer. It is accurate about the
 * software; whether it is sufficient for a given jurisdiction is a question
 * for counsel.
 */
export const legalDocuments: readonly LegalDocument[] = [
  {
    slug: "privacy",
    title: "Privacy",
    updated: "October 2026",
    intro: `What we collect when you use this site or work with us, why we hold it, and what you can ask us to do with it. ${site.name} is the trading name of ${site.legalName}, a limited liability company registered in ${site.jurisdiction}, and that company is responsible for the data described here.`,
    sections: [
      {
        heading: "What we collect",
        body: [
          "If you send us an enquiry, we hold what you typed: your name, your email address, and the phone number, company, budget range and message where you give them.",
          "If you subscribe to updates, we hold the email address you gave and nothing else.",
          "If you hold an account with us, as a client or a member of our team, we hold the details needed to run it: your name, your email address, what you are allowed to see, and a record of what you did in the system.",
          "We record basic technical information about requests to this site, including a one-way hash of the originating address, to apply rate limits and detect abuse. We do not keep the address itself.",
        ],
      },
      {
        heading: "Why we hold it",
        body: [
          "To reply to you. If you contact us, we use your details to answer and to carry on that conversation.",
          "To send you what you asked for, where you asked to be sent it, and to stop when you ask us to stop.",
          "To operate the site safely, which includes rate limiting and preventing abuse of our forms.",
          "Where you become a client, to deliver the work we agreed, to run the systems we built for you, and to meet our obligations under that agreement.",
          "Where the law requires us to keep something, for as long as it requires.",
        ],
      },
      {
        heading: "What we never do",
        body: [
          "We do not sell your details, and we never have. There is no arrangement under which anyone pays us for them.",
          "We do not share them with third parties for those parties' own marketing.",
          "We do not add you to a mailing list because you sent an enquiry or booked a call. Subscribing is a separate thing you have to choose.",
          "We do not build a profile of you across other websites, and nothing on this site follows you to one.",
        ],
      },
      {
        heading: "Cookies and measurement",
        body: [
          "This site sets no advertising cookies. Nothing is sold to anyone and nothing follows you elsewhere.",
          "When you first arrive we ask whether you are willing to be measured. Until you accept, no measurement script is loaded at all. If you decline, none is loaded either, and the site works exactly the same. You can change that answer at any time from the cookie settings link in the footer.",
          "If you accept, we use Vercel Web Analytics and Vercel Speed Insights. Neither sets a cookie nor reads one, and no identifier is carried to another site. It tells us which pages are read, roughly which country a visit came from, and which pages lead to an enquiry or a booking. Pages behind a login are excluded from measurement entirely.",
          "The only cookies this site sets are the ones that keep you signed in if you hold an account with us. Those are necessary for the site to work and they stay whatever you answer.",
          `Booking a call uses Calendly, which stores data in your browser. It does not load until you ask it to, either by accepting measurement or by opening the booking page. If you would rather it never loaded, email ${site.email} and we will find a time by hand.`,
          "Your answer to the measurement question is kept in your browser's local storage rather than in a cookie, and it is never sent to us.",
        ],
      },
      {
        heading: "Who else processes it",
        body: [
          "Vercel hosts this site and provides the measurement described above. Supabase stores enquiries, accounts and client records. Resend delivers our email. Calendly handles scheduling when you book a call. OpenAI drafts progress summaries inside the client workspace, from the project notes our team writes there.",
          "Each of them processes data on our instructions and for no purpose of their own. We add a provider only when the site needs one, and this list is the whole of it.",
        ],
      },
      {
        heading: "Where your data goes",
        body: [
          "We are a United States company and our providers are largely United States companies, so data you send us is processed in the United States and may be processed in other countries where those providers operate.",
          "We work with clients in the United Kingdom, the United Arab Emirates and Saudi Arabia among others. Where we handle personal data on a client's behalf, that is governed by the agreement with that client, including any terms it sets about where the data may be held.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Enquiries are kept while the conversation is live and for a reasonable period afterwards, so that we can pick it up again if you come back.",
          "Subscription addresses are kept until you unsubscribe.",
          "Client records are kept for the length of the engagement and for as long as we are required to retain them afterwards.",
        ],
      },
      {
        heading: "How we protect it",
        body: [
          "Access to client records is restricted by role, so a person sees the part of the system that belongs to them and nothing else. Accounts are protected by login, and credentials we hold on a client's behalf are encrypted.",
          "No system is perfect, and we would rather say that than claim otherwise. If something goes wrong that affects you, we will tell you.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can ask what we hold about you, ask us to correct it, ask us to delete it, or ask for a copy of it. You can tell us to stop sending you things at any time, and every email we send has a way to do that.",
          "Depending on where you live you may have further rights, including under the laws of a United States state, the UK and EU General Data Protection Regulations, or Saudi Arabia's Personal Data Protection Law. We apply the same process whoever is asking.",
          `Write to ${site.email} and we will respond. We will not charge you, and we will not make you create an account to ask.`,
          "If you are not satisfied with our answer, you can complain to the data protection authority where you live.",
        ],
      },
      {
        heading: "Children",
        body: [
          "This site is for businesses. It is not directed at children and we do not knowingly collect anything from them. If you believe a child has sent us something, write to us and we will delete it.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "When this changes we update the date at the top. If a change materially affects what we do with data we already hold, we will say so rather than quietly amend the page.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms",
    updated: "October 2026",
    intro: `These terms are between you and ${site.legalName}, a limited liability company registered in ${site.jurisdiction}, trading as ${site.name}. They cover your use of this website. Client work is governed by the separate agreement we sign with you, which takes precedence over anything here.`,
    sections: [
      {
        heading: "Using this site",
        body: [
          "You may read this site and use what is on it. You may not attempt to disrupt it, work around its rate limits, or scrape it at a volume that degrades it for anyone else.",
          "You may quote and link to what is published here with attribution.",
        ],
      },
      {
        heading: "Booking a call",
        body: [
          "A booking is a time we have agreed to talk. It is free, it carries no obligation on either side, and either of us can move or cancel it.",
        ],
      },
      {
        heading: "What we say about our work",
        body: [
          "Case studies describe work we have delivered. Where a client has asked not to be named, we describe the shape of the work without naming them.",
          "Figures on this site come from the client whose project they describe, or are arithmetic you can check yourself. Where a figure is an estimate we say so.",
          "Nothing in a case study is a prediction of what the same approach would do for you.",
        ],
      },
      {
        heading: "Intellectual property",
        body: [
          "The content, design and code of this site belong to us. Ownership of anything we build for a client is set out in that client's agreement, not here.",
          "Third-party names and marks that appear on this site belong to their owners and are used to describe the work, not to imply any endorsement.",
        ],
      },
      {
        heading: "Availability",
        body: [
          "We do not promise that this site will be available without interruption. We may change it, take parts of it down, or stop offering a tool on it, without notice.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "This site is provided as it is. We are not liable for decisions taken on the basis of anything published here.",
          "Nothing in these terms limits liability where the law does not allow it to be limited, including for fraud or for death or personal injury caused by negligence.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          `These terms are governed by the laws of ${site.jurisdiction}, without regard to conflict-of-law rules, and the courts there have exclusive jurisdiction.`,
        ],
      },
      {
        heading: "Changes",
        body: [
          "We may update these terms. The date at the top says when we last did. Using the site after a change means you accept the version then published.",
        ],
      },
      {
        heading: "Contact",
        body: [`Questions about these terms go to ${site.email}.`],
      },
    ],
  },
] as const;

export function legalBySlug(slug: string) {
  return legalDocuments.find((doc) => doc.slug === slug);
}
