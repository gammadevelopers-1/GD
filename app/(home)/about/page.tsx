import type { Metadata } from "next";

import { AboutCta } from "@/components/gamma/about-cta";
import { AboutHero } from "@/components/gamma/about-hero";
import { AboutPeople } from "@/components/gamma/about-people";
import { AboutPractice } from "@/components/gamma/about-practice";
import { about } from "@/lib/content/about";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "About",
  description: about.hero.lead,
  path: "/about",
});

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
