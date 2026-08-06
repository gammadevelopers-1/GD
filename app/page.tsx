import { ScrollProgress } from "../components/layout/scroll-progress";
import { SiteFooter } from "../components/layout/site-footer";
import { SiteNav } from "../components/layout/site-nav";
import { CapabilitiesSection } from "../components/sections/capabilities-section";
import { FaqSection } from "../components/sections/faq-section";
import { FlowSection } from "../components/sections/flow-section";
import { HeroSection } from "../components/sections/hero/hero-section";
import { LogoMarquee } from "../components/sections/logo-marquee";
import { ProofSection } from "../components/sections/proof-section";

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <SiteNav />
      <main>
        <HeroSection />
        <LogoMarquee />
        <FlowSection />
        <CapabilitiesSection />
        <ProofSection />
        <FaqSection />
      </main>
      <SiteFooter />
    </>
  );
}
