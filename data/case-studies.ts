import "server-only";

import { createClient as createPublicClient } from "@supabase/supabase-js";

import {
  CASE_COLUMNS,
  CASE_KIND,
  toCaseStudy,
  type CaseRecord,
} from "@/lib/cases/record";
import { publishedCases, type CaseStudy } from "@/lib/content/cases";
import { getSupabaseConfig, hasSupabaseConfig } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/**
 * Case studies come from the console once any have been written there, and
 * from the file in the repo until then.
 *
 * The fallback is not a nicety. The marketing site is the front door, and a
 * database that is paused, unreachable or simply empty should not be able to
 * empty it. The file is the floor the site cannot fall through.
 */

/** No cookies, so pages reading this can still be statically generated. */
function publicClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createPublicClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getPublishedCases(): Promise<readonly CaseStudy[]> {
  if (!hasSupabaseConfig()) return publishedCases;

  try {
    const { data, error } = await publicClient()
      .from("cms_pages")
      .select(CASE_COLUMNS)
      .eq("status", "published")
      .is("archived_at", null)
      .contains("content", { kind: CASE_KIND });

    if (error || !data?.length) return publishedCases;

    const studies = data
      .map(toCaseStudy)
      .filter((row): row is CaseRecord => row !== null)
      .map((row) => row.study)
      .toSorted((a, b) => a.order - b.order);

    return studies.length ? studies : publishedCases;
  } catch {
    // Unreachable database. The file still has the site covered.
    return publishedCases;
  }
}

export async function getPublishedCase(slug: string) {
  const all = await getPublishedCases();
  return all.find((item) => item.slug === slug);
}

/** The one after this one, wrapping at the end. */
export async function getNextCase(slug: string) {
  const all = await getPublishedCases();
  const at = all.findIndex((item) => item.slug === slug);
  if (at < 0) return undefined;
  return all[(at + 1) % all.length];
}

/** Everything, including drafts and archived. Owner only, via their session. */
export async function getAllCaseRecords(): Promise<readonly CaseRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_pages")
    .select(CASE_COLUMNS)
    .contains("content", { kind: CASE_KIND })
    .order("updated_at", { ascending: false });

  return (data ?? [])
    .map(toCaseStudy)
    .filter((row): row is CaseRecord => row !== null)
    .toSorted((a, b) => a.study.order - b.study.order);
}

export async function getCaseRecord(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cms_pages")
    .select(CASE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  return data ? toCaseStudy(data) : null;
}

/** True once at least one case study exists in the console. */
export async function hasCaseRecords() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("cms_pages")
    .select("id", { count: "exact", head: true })
    .contains("content", { kind: CASE_KIND });

  return (count ?? 0) > 0;
}
