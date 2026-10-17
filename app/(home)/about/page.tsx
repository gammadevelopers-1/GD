import type { Metadata } from "next";

import { AboutCta } from "@/components/gamma/about-cta";
import { AboutHero } from "@/components/gamma/about-hero";
import { AboutPeople } from "@/components/gamma/about-people";
import { AboutPractice } from "@/components/gamma/about-practice";
import { about } from "@/lib/content/about";
import { site } from "@/lib/content/site";

export const metadata: Metadata = {
  title: `About · ${site.name}`,
  description: about.hero.lead,
};

export default function AboutPage() {
  return (
    <main id="top">
      <AboutHero />
      <AboutPractice />
      <AboutPeople />
      <AboutCta />
    </main>
  );
}
