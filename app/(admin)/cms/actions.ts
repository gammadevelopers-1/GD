"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/data/auth";
import { getCaseRecord } from "@/data/case-studies";
import { CASE_KIND, toContent } from "@/lib/cases/record";
import { caseStudies, type CaseStudy } from "@/lib/content/cases";
import {
  formError,
  formSuccess,
  type SimpleFormState,
} from "@/lib/projects/form-state";
import { createClient } from "@/lib/supabase/server";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TITLE_MAX = 200;

/** Every surface that reads case studies. */
function refresh(slug?: string) {
  revalidatePath("/cms");
  revalidatePath("/work");
  revalidatePath("/", "layout"); // the footer's proof column
  if (slug) revalidatePath(`/work/${slug}`);
}

function text(form: FormData, key: string, max = 4000) {
  return String(form.get(key) ?? "")
    .trim()
    .slice(0, max);
}

/** Textareas where one line is one entry. Blank lines are not entries. */
function lines(form: FormData, key: string) {
  return text(form, key, 20000)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** "Label :: sentence" per line, which keeps the repeatable blocks typeable
 *  without building a drag-and-drop editor for them. */
function pairs(form: FormData, key: string) {
  return lines(form, key).map((line) => {
    const at = line.indexOf("::");
    return at < 0
      ? { label: line, body: "" }
      : { label: line.slice(0, at).trim(), body: line.slice(at + 2).trim() };
  });
}

function readStudy(form: FormData, slug: string): CaseStudy {
  const stats = pairs(form, "stats").map((row) => ({
    value: row.label,
    label: row.body,
  }));
  const points = pairs(form, "resultPoints").map((row) =>
    row.body ? { value: row.label, text: row.body } : { text: row.label },
  );

  const leakBody = lines(form, "leakBody");
  const builtItems = pairs(form, "builtItems");
  const aiItems = pairs(form, "aiItems");
  const leakHeading = text(form, "leakHeading", 300);
  const leakImage = text(form, "leakImage", 400);
  const builtHeading = text(form, "builtHeading", 300);
  const builtImage = text(form, "builtImage", 400);
  const builtImageAspect = text(form, "builtImageAspect", 20);
  const aiHeading = text(form, "aiHeading", 300);
  const aiLead = text(form, "aiLead", 1200);
  const resultsHeading = text(form, "resultsHeading", 300);
  const takeawayLine = text(form, "takeawayLine", 400);
  const about = text(form, "about", 2000);
  const human = text(form, "human", 2000);
  const humanImage = text(form, "humanImage", 400);
  const cta = text(form, "cta", 400);
  const ctaImage = text(form, "ctaImage", 400);
  const heroImage = text(form, "heroImage", 400);
  const heroAspect = text(form, "heroAspect", 20);

  return {
    slug,
    status: "draft",
    order: Number(text(form, "order", 6)) || 999,
    client: text(form, "client", 200),
    named: form.get("named") === "on",
    sector: text(form, "sector", 160),
    vertical: text(form, "vertical", 80),
    region: text(form, "region", 120),
    category: text(form, "category", 240),
    title: text(form, "title", TITLE_MAX),
    body: text(form, "body", 600),
    tags: lines(form, "tags"),
    image: text(form, "image", 400) || "/case-study.jpg",
    ...(heroImage ? { heroImage } : {}),
    ...(heroAspect ? { heroAspect } : {}),
    gallery: pairs(form, "gallery").map((row) => ({
      src: row.label,
      caption: row.body,
    })),
    stats,
    ...(about ? { about } : {}),
    ...(leakHeading
      ? {
          leak: {
            heading: leakHeading,
            body: leakBody,
            ...(leakImage ? { image: leakImage } : {}),
          },
        }
      : {}),
    ...(builtHeading
      ? {
          built: {
            heading: builtHeading,
            items: builtItems,
            ...(builtImage ? { image: builtImage } : {}),
            ...(builtImageAspect
              ? { imageAspect: builtImageAspect }
              : {}),
          },
        }
      : {}),
    ...(aiHeading
      ? {
          ai: {
            heading: aiHeading,
            ...(aiLead ? { lead: aiLead } : {}),
            items: aiItems,
          },
        }
      : {}),
    ...(resultsHeading
      ? {
          results: {
            heading: resultsHeading,
            lead: text(form, "resultsLead", 1200),
            points,
          },
        }
      : {}),
    ...(human ? { human } : {}),
    ...(humanImage ? { humanImage } : {}),
    ...(takeawayLine
      ? {
          takeaway: {
            line: takeawayLine,
            body: text(form, "takeawayBody", 1200),
          },
        }
      : {}),
    ...(cta ? { cta } : {}),
    ...(ctaImage ? { ctaImage } : {}),
  };
}

export async function saveCaseStudy(
  _state: SimpleFormState,
  form: FormData,
): Promise<SimpleFormState> {
  const viewer = await requireRole(["owner"]);

  const id = text(form, "id", 64);
  const slug = text(form, "slug", 120).toLowerCase();
  const title = text(form, "title", TITLE_MAX);

  if (!SLUG.test(slug)) {
    return formError(
      "The web address can only use lowercase letters, numbers and hyphens.",
    );
  }
  if (!title) return formError("Give the case study a headline.");

  const supabase = await createClient();
  const content = toContent(readStudy(form, slug));

  if (id) {
    const { error } = await supabase
      .from("cms_pages")
      .update({ slug, title, content })
      .eq("id", id);
    if (error) return formError(error.message);
  } else {
    const { error } = await supabase.from("cms_pages").insert({
      slug,
      title,
      content,
      status: "draft",
      created_by: viewer.id,
    });
    if (error) {
      return formError(
        error.code === "23505"
          ? "A page already uses that web address."
          : error.message,
      );
    }
  }

  refresh(slug);
  return formSuccess(id ? "Saved." : "Created as a draft.");
}

/** Live or not. Publishing has to stamp published_at: the table rejects a
 *  published row without one. */
export async function setCaseStatus(
  id: string,
  status: "draft" | "published",
): Promise<SimpleFormState> {
  await requireRole(["owner"]);

  const record = await getCaseRecord(id);
  if (!record) return formError("That case study no longer exists.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("cms_pages")
    .update({
      status,
      published_at: status === "published" ? new Date().toISOString() : null,
      archived_at: null,
    })
    .eq("id", id);

  if (error) return formError(error.message);

  refresh(record.study.slug);
  return formSuccess(status === "published" ? "Live." : "Taken down.");
}

/**
 * The table grants no delete, by design, so removal is an archive. It leaves
 * the site immediately and the writing is still there if it was a mistake.
 */
export async function archiveCaseStudy(id: string): Promise<SimpleFormState> {
  await requireRole(["owner"]);

  const record = await getCaseRecord(id);
  if (!record) return formError("That case study no longer exists.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("cms_pages")
    .update({ status: "archived", archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return formError(error.message);

  refresh(record.study.slug);
  return formSuccess("Archived.");
}

export async function restoreCaseStudy(id: string): Promise<SimpleFormState> {
  await requireRole(["owner"]);

  const supabase = await createClient();
  const { error } = await supabase
    .from("cms_pages")
    .update({ status: "draft", archived_at: null, published_at: null })
    .eq("id", id);

  if (error) return formError(error.message);

  refresh();
  return formSuccess("Back in drafts.");
}

/** Display order on /work and in the footer. */
export async function moveCaseStudy(
  id: string,
  direction: "up" | "down",
): Promise<SimpleFormState> {
  await requireRole(["owner"]);

  const record = await getCaseRecord(id);
  if (!record) return formError("That case study no longer exists.");

  const step = direction === "up" ? -1 : 1;
  const supabase = await createClient();
  const { error } = await supabase
    .from("cms_pages")
    .update({
      content: { ...toContent(record.study), order: record.study.order + step },
    })
    .eq("id", id);

  if (error) return formError(error.message);

  refresh(record.study.slug);
  return formSuccess("Moved.");
}

/**
 * First run only. Copies the case studies written in the repo into the
 * console so there is something to edit, rather than asking someone to retype
 * five finished case studies into a form.
 */
export async function importCaseStudies(): Promise<SimpleFormState> {
  const viewer = await requireRole(["owner"]);
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("cms_pages")
    .select("slug")
    .contains("content", { kind: CASE_KIND });

  const taken = new Set((existing ?? []).map((row) => String(row.slug)));
  const pending = caseStudies.filter((study) => !taken.has(study.slug));

  if (!pending.length) return formSuccess("Everything is already imported.");

  const now = new Date().toISOString();
  const { error } = await supabase.from("cms_pages").insert(
    pending.map((study) => ({
      slug: study.slug,
      title: study.title,
      content: toContent(study),
      status: study.status,
      published_at: study.status === "published" ? now : null,
      created_by: viewer.id,
    })),
  );

  if (error) return formError(error.message);

  refresh();
  return formSuccess(
    `Imported ${pending.length} case ${pending.length === 1 ? "study" : "studies"}.`,
  );
}
