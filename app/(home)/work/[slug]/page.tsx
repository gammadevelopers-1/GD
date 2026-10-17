import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  StoryAbout,
  StoryBuilt,
  StoryCloser,
  StoryGallery,
  StoryHero,
  StoryHuman,
  StoryLeak,
  StoryResults,
  StoryTakeaway,
} from "@/components/gamma/story-sections";
import {
  getNextCase,
  getPublishedCase,
  getPublishedCases,
} from "@/data/case-studies";
import { caseLabels } from "@/lib/content/cases";
import { site } from "@/lib/content/site";

// A case study written in the console gets its page without a deploy, so
// unknown slugs are rendered on demand rather than 404ed.
export const dynamicParams = true;
export const revalidate = 300;

export async function generateStaticParams() {
  const items = await getPublishedCases();
  return items.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const study = await getPublishedCase(slug);
  if (!study) return {};

  return {
    title: `${study.title} · ${site.name}`,
    description: study.body,
    openGraph: {
      title: study.title,
      description: study.body,
      images: [study.image],
    },
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const study = await getPublishedCase(slug);
  if (!study) notFound();

  const next = await getNextCase(slug);

  return (
    <main id="top">
      <StoryHero study={study} labels={caseLabels} backHref="/work" />
      <StoryAbout study={study} labels={caseLabels} />
      <StoryLeak study={study} labels={caseLabels} />
      <StoryBuilt study={study} labels={caseLabels} />
      <StoryGallery study={study} labels={caseLabels} />
      <StoryResults study={study} labels={caseLabels} />
      <StoryHuman study={study} labels={caseLabels} />
      <StoryTakeaway study={study} labels={caseLabels} />
      <StoryCloser
        study={study}
        labels={caseLabels}
        next={
          next
            ? {
                href: `/work/${next.slug}`,
                label: caseLabels.next,
                title: next.title,
              }
            : undefined
        }
      />
    </main>
  );
}
