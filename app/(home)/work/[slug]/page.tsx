import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { StoryRail } from "@/components/gamma/story-rail";
import {
  StoryAbout,
  StoryAI,
  StoryBuilt,
  StoryCloser,
  StoryGallery,
  StoryHero,
  StoryHuman,
  StoryLeak,
  StoryProgress,
  StoryResults,
  StoryTakeaway,
  StoryTestimonial,
  storyMeta,
  storySections,
} from "@/components/gamma/story-sections";
import {
  getNextCase,
  getPublishedCase,
  getPublishedCases,
} from "@/data/case-studies";
import { caseLabels } from "@/lib/content/cases";
import { absoluteUrl, clipTitle, pageMeta } from "@/lib/seo";
import {
  BreadcrumbJsonLd,
  CaseStudyJsonLd,
} from "@/components/common/json-ld";

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

  return pageMeta({
    // The headline runs long. The page keeps all of it; the tab and the
    // search result get a version that ends on a word.
    title: clipTitle(study.title),
    description: study.body,
    path: `/work/${slug}`,
    image: absoluteUrl(study.image),
    type: "article",
  });
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
      <CaseStudyJsonLd
        title={study.title}
        description={study.body}
        path={`/work/${slug}`}
        image={study.image}
        sector={study.sector}
        region={study.region}
      />
      <BreadcrumbJsonLd
        trail={[
          { name: "Home", path: "/" },
          { name: "Case studies", path: "/work" },
          { name: study.title, path: `/work/${slug}` },
        ]}
      />

      <StoryProgress />

      <StoryHero study={study} labels={caseLabels} backHref="/work" />

      {/* The story runs in one column beside the rail. Giving the column its
          own width is what fixes the empty right-hand half: the headings and
          prose now fill what they are given instead of stopping at a measure
          set for a row twice as wide. */}
      <div className="bg-ground">
        <div className="mx-auto grid w-full max-w-[1280px] gap-x-[clamp(32px,3.6vw,72px)] px-6 py-[clamp(44px,4.8vw,76px)] lg:grid-cols-[224px_minmax(0,1fr)]">
          <StoryRail
            sections={storySections(study, caseLabels)}
            meta={storyMeta(study, caseLabels)}
          />

          <div className="flex min-w-0 flex-col gap-y-[clamp(40px,4.4vw,68px)]">
            <StoryTestimonial study={study} labels={caseLabels} />
            <StoryAbout study={study} labels={caseLabels} />
            <StoryLeak study={study} labels={caseLabels} />
            <StoryBuilt study={study} labels={caseLabels} />
            <StoryAI study={study} labels={caseLabels} />
            <StoryGallery study={study} labels={caseLabels} />
            <StoryResults study={study} labels={caseLabels} />
            <StoryHuman study={study} labels={caseLabels} />
            <StoryTakeaway study={study} labels={caseLabels} />
          </div>
        </div>
      </div>

      <StoryCloser
        study={study}
        labels={caseLabels}
        next={
          next
            ? {
                href: `/work/${next.slug}`,
                label: caseLabels.next,
                title: next.title,
                image: next.image,
                body: next.body,
                eyebrow: `${next.vertical} \u00b7 ${next.region}`,
              }
            : undefined
        }
      />
    </main>
  );
}
