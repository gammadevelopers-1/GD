import { BookAuditSection } from "@/components/sections/book-audit-section";
import { ComplianceSection } from "@/components/sections/compliance-section";
import { HeroSection } from "@/components/sections/hero/hero-section";
import { LogoMarquee } from "@/components/sections/logo-marquee";
import { OutcomesSection } from "@/components/sections/outcomes-section";
import { ProcessSection } from "@/components/sections/process-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import { WorkSection } from "@/components/sections/work-section";

export default function HomePage() {
  return (
    <main id="top">
      <HeroSection />
      <LogoMarquee />
      <ProcessSection />
      <OutcomesSection />
      <WorkSection />
      <TestimonialsSection />
      <ComplianceSection />
      <BookAuditSection />
    </main>
  );
}
