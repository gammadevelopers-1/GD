import type { CaseStudy } from "@/lib/content/cases";

/**
 * Case studies live in `cms_pages`, which already has everything they need:
 * a jsonb body, a draft/published/archived status, and a published_at. The
 * only thing it lacks is a way to tell one kind of page from another, so
 * every case study row carries this marker inside its content.
 */
export const CASE_KIND = "case_study";

/** The columns a case study row reads from. */
export const CASE_COLUMNS =
  "id, slug, title, content, status, published_at, archived_at, updated_at";

export type CaseRecord = {
  id: string;
  /** Mirrors the row's status, which the public reader filters on. */
  status: "draft" | "published" | "archived";
  updatedAt: string;
  study: CaseStudy;
};

type Row = {
  id: unknown;
  slug: unknown;
  title: unknown;
  content: unknown;
  status: unknown;
  archived_at?: unknown;
  updated_at?: unknown;
};

const str = (value: unknown, fallback = "") =>
  typeof value === "string" ? value : fallback;

const list = <T>(value: unknown, map: (item: unknown) => T | null): T[] =>
  Array.isArray(value)
    ? value.map(map).filter((item): item is T => item !== null)
    : [];

function stat(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const label = str(row.label);
  const figure = str(row.value);
  return label || figure ? { value: figure, label } : null;
}

function builtItem(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const label = str(row.label);
  return label ? { label, body: str(row.body) } : null;
}

function resultPoint(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const text = str(row.text);
  if (!text) return null;
  const figure = str(row.value);
  return figure ? { value: figure, text } : { text };
}

function shot(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const src = str(row.src);
  return src ? { src, caption: str(row.caption) } : null;
}

function strings(value: unknown) {
  return list(value, (item) => (typeof item === "string" ? item : null));
}

function section(value: unknown) {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

/**
 * Rows are written by the console and could have been edited by hand, so
 * nothing here trusts the shape. Anything unreadable is dropped rather than
 * thrown, because one malformed field should not take the page down.
 */
export function toCaseStudy(row: Row): CaseRecord | null {
  const slug = str(row.slug);
  if (!slug) return null;

  const content = section(row.content);
  if (str(content.kind) !== CASE_KIND) return null;

  const leak = section(content.leak);
  const built = section(content.built);
  const results = section(content.results);
  const takeaway = section(content.takeaway);

  const status = str(row.status, "draft");

  const study: CaseStudy = {
    slug,
    status: status === "published" ? "published" : "draft",
    order: typeof content.order === "number" ? content.order : 999,
    client: str(content.client),
    named: content.named === true,
    sector: str(content.sector),
    vertical: str(content.vertical),
    region: str(content.region),
    category: str(content.category),
    title: str(row.title),
    body: str(content.body),
    tags: strings(content.tags),
    image: str(content.image, "/case-study.jpg"),
    ...(str(content.heroImage) ? { heroImage: str(content.heroImage) } : {}),
    gallery: list(content.gallery, shot),
    stats: list(content.stats, stat),
    ...(str(content.about) ? { about: str(content.about) } : {}),
    ...(str(leak.heading)
      ? {
          leak: {
            heading: str(leak.heading),
            body: strings(leak.body),
            ...(str(leak.image) ? { image: str(leak.image) } : {}),
          },
        }
      : {}),
    ...(str(built.heading)
      ? {
          built: {
            heading: str(built.heading),
            items: list(built.items, builtItem),
            ...(str(built.image) ? { image: str(built.image) } : {}),
          },
        }
      : {}),
    ...(str(results.heading)
      ? {
          results: {
            heading: str(results.heading),
            lead: str(results.lead),
            points: list(results.points, resultPoint),
          },
        }
      : {}),
    ...(str(content.human) ? { human: str(content.human) } : {}),
    ...(str(takeaway.line)
      ? { takeaway: { line: str(takeaway.line), body: str(takeaway.body) } }
      : {}),
    ...(str(content.cta) ? { cta: str(content.cta) } : {}),
    ...(content.nda === true ? { nda: true } : {}),
  };

  return {
    id: str(row.id),
    status:
      status === "published" || status === "archived" ? status : "draft",
    updatedAt: str(row.updated_at),
    study,
  };
}

/** The other direction: a case study as the jsonb body of a cms_pages row. */
export function toContent(study: CaseStudy) {
  // slug, status and title are columns on the row, so they are not repeated
  // inside the body where the two could drift apart.
  const body: Record<string, unknown> = { ...study, kind: CASE_KIND };
  delete body.slug;
  delete body.status;
  delete body.title;
  return body;
}
