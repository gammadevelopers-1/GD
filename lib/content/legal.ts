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

export const legalDocuments: readonly LegalDocument[] = [
  {
    slug: "privacy",
    title: "Privacy",
    updated: "October 2026",
    intro: `This describes what we collect when you use this site or work with us, why we hold it, and what you can ask us to do with it. ${site.name} is the trading name of ${site.legalName}, a limited liability company registered in ${site.jurisdiction}, and that company is responsible for the data described here.`,
    sections: [
      {
        heading: "What we collect",
        body: [
          "If you submit a form, we hold what you typed into it: your name, your email address, your company where you give it, and whatever you wrote in the open field.",
          "If you use the workflow analysis on the homepage, we process the description you enter in order to return a result. We do not require an account and we do not ask for an email address to show you the output.",
          "We record basic technical information about requests to this site, including a hashed form of the originating address, in order to apply rate limits and detect abuse.",
        ],
      },
      {
        heading: "Why we hold it",
        body: [
          "To reply to you. If you contact us, we use your details to answer and to continue that conversation.",
          "To operate the site safely, which includes rate limiting and preventing abuse of the analysis tool.",
          "Where you become a client, to deliver the work we have agreed and to meet our obligations under that agreement.",
        ],
      },
      {
        heading: "What we do not do",
        body: [
          "We do not sell your details. We do not share them with third parties for their own marketing.",
          "We do not add you to a mailing list because you used the analysis tool or submitted a contact form.",
        ],
      },
      {
        heading: "Cookies and measurement",
        body: [
          "This site sets no advertising cookies and builds no profile of you across other sites. Nothing is sold to anyone and nothing follows you elsewhere.",
          "When you first arrive we ask whether you are willing to be measured. Until you accept, no measurement script is loaded at all. If you decline, none is loaded either, and the site works exactly the same. You can change that answer at any time using the cookie settings link in the footer.",
          "If you accept, we use Vercel Web Analytics and Vercel Speed Insights. Neither sets a cookie nor reads one, and no identifier is carried to another site. It tells us which pages are read, roughly which country a visit came from, and which of them lead to an enquiry or a booking. Pages behind a login are excluded from measurement entirely.",
          "The only cookies this site sets are the ones that keep you signed in if you hold an account with us. Those are necessary for the site to function, and they stay whatever you answer.",
          `Booking a call uses Calendly, a third party that stores data in your browser. It does not load until you ask it to, either by accepting above or by pressing the button on the booking page. If you would rather it never loaded, email ${site.email} and we will find a time by hand.`,
          "Your answer is kept in your browser's local storage rather than in a cookie, and it is never sent to us.",
        ],
      },
      {
        heading: "Processors",
        body: [
          "Vercel hosts this site and provides the measurement described above. Supabase stores enquiries and client records. Resend delivers our email. OpenAI processes the text you enter into the analysis tool. Calendly handles scheduling when you book a call.",
          "Each processes data on our instructions and for no purpose of their own.",
        ],
      },
      {
        heading: "How long we keep it",
        body: [
          "Enquiries are kept while the conversation is live and for a reasonable period afterwards. Client records are kept for the duration of the engagement and for as long as we are required to retain them afterwards.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          `You can ask what we hold about you, ask us to correct it, or ask us to delete it. Write to ${site.email} and we will respond.`,
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
          "You may read this site and use the tools on it. You may not attempt to disrupt it, work around rate limits, or use it to process data you do not have the right to process.",
        ],
      },
      {
        heading: "The workflow analysis tool",
        body: [
          "The analysis returned by the tool on this site is generated automatically and offered as a starting point for a conversation. It is not advice, it is not a quote, and it is not a commitment to deliver anything.",
          "Do not paste confidential or personal data belonging to third parties into it.",
        ],
      },
      {
        heading: "Content and claims",
        body: [
          "Case studies describe work we have delivered. Where a client is under a confidentiality agreement, we describe the shape of the work without the detail.",
          "Figures shown on this site are either arithmetic you can check yourself or are cited to a named source with its year.",
        ],
      },
      {
        heading: "Intellectual property",
        body: [
          "The content and design of this site belong to us. Ownership of anything we build for a client is set out in that client's agreement.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "This site is provided as it is. We are not liable for decisions taken on the basis of the analysis tool or any other content here. Nothing in these terms limits liability where the law does not allow it to be limited.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          `These terms are governed by the laws of ${site.jurisdiction}, without regard to conflict-of-law rules.`,
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
