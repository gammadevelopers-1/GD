import type { CaseStudy } from "@/lib/content/cases";
import { site } from "@/lib/content/site";

/**
 * Things we built for ourselves, as opposed to for a client. Same shape as a
 * case study because the story is the same shape: here is what was wrong,
 * here is what we built, here is what happened.
 */
export const products: readonly CaseStudy[] = [
  {
    slug: "hiretics",
    status: "published",
    order: 1,
    client: site.name,
    named: true,
    sector: "Recruitment and HR tech",
    vertical: "Hiring",
    region: "Live beta",
    category: "Our product · AI recruitment · Serverless SaaS",
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
];

export function productBySlug(slug: string) {
  return products.find((item) => item.slug === slug);
}

/** Section labels for a product. A client had a leak; a product had a
 *  problem, and there is no client to name as the builder. */
export const productLabels = {
  about: "About",
  leak: "The problem",
  built: "What we built",
  results: "Where it is now",
  human: "What's still human",
  takeaway: "Takeaway",
  gallery: "Inside the product",
  industry: "Category",
  location: "Status",
  builtBy: "Built by",
  next: "Case studies",
  back: "All case studies",
  cta: {
    label: "Book a call",
    note: "Free · 30 minutes · no preparation needed",
  },
} as const;
