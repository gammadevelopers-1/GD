import type { CookieOptions } from "@supabase/ssr";

const YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

export const AUTH_COOKIE_OPTIONS: CookieOptions = {
  maxAge: YEAR_IN_SECONDS,
  sameSite: "lax",
  path: "/",
};
