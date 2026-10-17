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
import { productBySlug, productLabels, products } from "@/lib/content/products";
import { site } from "@/lib/content/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) return {};

  return {
    title: `${product.title} · ${site.name}`,
    description: product.body,
    openGraph: {
      title: product.title,
      description: product.body,
      images: [product.image],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = productBySlug(slug);
  if (!product) notFound();

  return (
    <main id="top">
      <StoryHero study={product} labels={productLabels} backHref="/work" />
      <StoryAbout study={product} labels={productLabels} />
      <StoryLeak study={product} labels={productLabels} />
      <StoryBuilt study={product} labels={productLabels} />
      <StoryGallery study={product} labels={productLabels} />
      <StoryResults study={product} labels={productLabels} />
      <StoryHuman study={product} labels={productLabels} />
      <StoryTakeaway study={product} labels={productLabels} />
      <StoryCloser
        study={product}
        labels={productLabels}
        next={{
          href: "/work",
          label: productLabels.next,
          title: "What we have built for other businesses",
        }}
      />
    </main>
  );
}
