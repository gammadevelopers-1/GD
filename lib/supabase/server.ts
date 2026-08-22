import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookies";
import { createTimedFetch } from "@/lib/perf/timing";

export async function createClient() {
  const cookieStore = await cookies();
  const headerList = await headers();
  const { url, publishableKey } = getSupabaseConfig();
  const clientIp =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headerList.get("x-real-ip")?.trim() ??
    "";
  const userAgent = headerList.get("user-agent")?.trim() ?? "";

  const forwarded: Record<string, string> = {};
  if (clientIp) {
    forwarded["x-gamma-client-ip"] = clientIp;
    forwarded["x-forwarded-for"] = clientIp;
  }
  if (userAgent) forwarded["user-agent"] = userAgent;

  const timedFetch = createTimedFetch();

  return createServerClient(url, publishableKey, {
    cookieOptions: AUTH_COOKIE_OPTIONS,
    global: {
      ...(Object.keys(forwarded).length ? { headers: forwarded } : {}),
      ...(timedFetch ? { fetch: timedFetch } : {}),
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {}
      },
    },
  });
}
