import { ChangesSection } from "@/components/gamma/changes-section";
import { FinalCta } from "@/components/gamma/final-cta";
import { WorkSection } from "@/components/gamma/work-section";
import { HeroSection } from "@/components/gamma/hero-section";
import { CalculatorSection } from "@/components/gamma/calculator-section";
import { ProblemSection } from "@/components/gamma/problem-section";
import { ProcessSection } from "@/components/gamma/process-section";
import { TestimonialsSection } from "@/components/gamma/testimonials-section";
import { TrustLine } from "@/components/gamma/trust-line";
import { getPublishedCases } from "@/data/case-studies";
import { work } from "@/lib/gamma-content";
import { site } from "@/lib/content/site";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  // Leads on the keyword rather than the brand, because the brand is
  // appended anyway and a search result is read left to right.
  title: `AI agents for SMBs that actually ship \u00b7 ${site.name}`,
  description:
    "AI agents and workflow automation for small and medium businesses. We map how your business actually runs, then build systems that reach production.",
  path: "/",
  absoluteTitle: true,
});

export const revalidate = 300;

export default async function HomePage() {
  const cases = await getPublishedCases();
  // Curated order first; anything curated but no longer published is skipped,
  // and the rest fill in behind it so the carousel is never short.
  const featured = [
    ...work.featured
      .map((slug) => cases.find((item) => item.slug === slug))
      .filter((item) => item !== undefined),
    ...cases.filter((item) => !(work.featured as readonly string[]).includes(item.slug)),
  ].slice(0, 6);

  return (
    <main id="top">
      <HeroSection />
      <ProblemSection />
      <ProcessSection />
      <ChangesSection />
      <TestimonialsSection />
      <WorkSection featured={featured} />
      <CalculatorSection />
      <TrustLine />
      <FinalCta />
    </main>
  );
}
