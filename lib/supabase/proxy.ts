import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig, getSupabaseConfig } from "@/lib/supabase/config";

const protectedRoots = [
  "/dashboard",
  "/projects",
  "/team",
  "/clients",
  "/cms",
];

function isProtectedPath(pathname: string) {
  return protectedRoots.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`),
  );
}

function isPortalPath(pathname: string) {
  return pathname === "/portal" || pathname.startsWith("/portal/");
}

function isPortalDoor(pathname: string) {
  return pathname === "/portal/sign-in";
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!hasSupabaseConfig()) {
    if (isProtectedPath(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("reason", "configuration");
      return NextResponse.redirect(url);
    }
    if (isPortalPath(pathname) && !isPortalDoor(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/portal/sign-in";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseConfig();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();

  const signedOut = Boolean(error) || !data?.claims;

  if (isProtectedPath(pathname) && signedOut) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isPortalPath(pathname) && !isPortalDoor(pathname) && signedOut) {
    const url = request.nextUrl.clone();
    url.pathname = "/portal/sign-in";
    url.search = "?reason=access";
    return NextResponse.redirect(url);
  }

  return response;
}
