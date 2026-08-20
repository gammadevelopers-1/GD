import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle } from "lucide-react";
import { Mark } from "@/components/layout/mark";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { isUuid } from "@/lib/projects/validation";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = {
  title: "Set your password · Internal platform",
  robots: { index: false, follow: false },
};

export default async function SetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    token?: string;
    email?: string;
    id?: string;
    kind?: string;
  }>;
}) {
  const { token, email, id, kind } = await searchParams;
  const isClient = kind === "client";
  const signInHref = isClient ? "/portal/sign-in" : "/login";
  const alreadySet = await passwordAlreadySet(id, isClient);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden px-5 py-10 sm:px-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(47,232,92,0.13),transparent_29%),radial-gradient(circle_at_84%_72%,rgba(110,231,183,0.07),transparent_26%)]" />

      <section className="relative w-full max-w-[430px]">
        <div className="mb-10 flex items-center gap-3">
          <Mark className="size-9 rounded-[10px]" />
          <span className="font-medium text-white">Gamma Developers</span>
        </div>

        <p className="font-mono text-[10px] tracking-[0.16em] text-[#2fe85c] uppercase">
          Welcome to the team
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-[2.3rem]">
          Set your password
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/40">
          You will sign in with your work email and this password from now on.
        </p>

        {alreadySet ? (
          <div className="mt-6 rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-200" />
              <div>
                <p className="text-sm leading-6 text-amber-100/75">
                  This link has already been used or has expired. If you have set
                  your password, sign in below. Otherwise ask an owner to send a
                  new one.
                </p>
                <Link
                  href={signInHref}
                  className="mt-3 inline-flex text-sm font-medium text-amber-100 transition hover:text-white"
                >
                  Sign in now
                </Link>
              </div>
            </div>
          </div>
        ) : null}

        {token ? (
          <SetPasswordForm
            token={token}
            email={email ?? ""}
            locked={alreadySet}
            kind={isClient ? "client" : "member"}
          />
        ) : (
          <div className="mt-8 rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] p-5">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-200" />
              <div>
                <p className="text-sm font-medium text-amber-100">
                  This link is incomplete
                </p>
                <p className="mt-1.5 text-sm leading-6 text-amber-100/55">
                  Open the link from your invitation email exactly as it was
                  sent, or ask an owner to send you a new one.
                </p>
              </div>
            </div>
          </div>
        )}

        <p className="mt-8 text-sm text-white/35">
          Already set it up?{" "}
          <Link
            href={signInHref}
            className="text-white/70 transition hover:text-white"
          >
            Sign in
          </Link>
        </p>
      </section>
    </div>
  );
}

async function passwordAlreadySet(
  accountId: string | undefined,
  isClient: boolean,
) {
  if (!accountId || !isUuid(accountId) || !hasSupabaseConfig()) return false;

  const supabase = await createClient();
  const { data } = await supabase.rpc(
    isClient ? "app_client_link_state" : "app_password_already_set",
    { target: accountId },
  );
  return data === true;
}
