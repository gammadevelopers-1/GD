import { NextResponse } from "next/server";
import { getViewer } from "@/data/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TTL_SECONDS = 60 * 60;

export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ urls: {} }, { status: 401 });
  }

  let paths: unknown;
  try {
    paths = (await request.json())?.paths;
  } catch {
    return NextResponse.json({ urls: {} }, { status: 400 });
  }

  const wanted = Array.isArray(paths)
    ? [
        ...new Set(
          paths.filter(
            (path): path is string =>
              typeof path === "string" &&
              path.includes("/ideas/") &&
              !path.includes("..") &&
              path.length <= 400,
          ),
        ),
      ].slice(0, 40)
    : [];

  if (!wanted.length) return NextResponse.json({ urls: {} });

  const supabase = await createClient();
  const { data } = await supabase.storage
    .from("app-project-attachments")
    .createSignedUrls(wanted, TTL_SECONDS);

  const urls: Record<string, string> = {};
  for (const entry of data ?? []) {
    if (entry?.path && entry.signedUrl) urls[entry.path] = entry.signedUrl;
  }

  return NextResponse.json({ urls });
}
