import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Mark } from "@/components/layout/mark";
import { getViewer } from "@/data/auth";
import { hasSupabaseConfig } from "@/lib/supabase/config";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in · Internal platform" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const configured = hasSupabaseConfig();
  if (configured && (await getViewer())) redirect("/dashboard");

  return (
    <div className="relative grid min-h-dvh overflow-hidden lg:grid-cols-[1.05fr_0.95fr]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(47,232,92,0.13),transparent_29%),radial-gradient(circle_at_84%_72%,rgba(110,231,183,0.07),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] [mask-image:linear-gradient(to_right,black,transparent_78%)] [background-size:52px_52px] opacity-25" />

      <section className="relative hidden min-h-dvh flex-col justify-between border-r border-white/[0.07] p-12 lg:flex xl:p-16">
        <Link
          href="/"
          className="flex w-fit items-center gap-3 text-sm font-medium text-white/80"
        >
          <Mark className="size-8 rounded-[9px]" />
          Gamma Developers
        </Link>

        <div className="max-w-xl pb-8">
          <h1 className="font-display text-[clamp(3.2rem,6vw,6.8rem)] leading-[0.88] font-semibold tracking-[-0.055em] text-[#ecece4]">
            One Place
            <br />
            Everyone Aligned
          </h1>
          <p className="mt-7 max-w-md text-base leading-7 text-white/45">
            Projects, people and the signals that keep Gamma moving without
            hunting through chats.
          </p>
        </div>

        <p className="font-mono text-[10px] tracking-[0.12em] text-white/25 uppercase"></p>
      </section>

      <section className="relative flex min-h-dvh items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[430px]">
          <Link
            href="/"
            className="mb-12 inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white lg:hidden"
          >
            <ArrowLeft className="size-4" /> Back to website
          </Link>

          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Mark className="size-9 rounded-[10px]" />
            <span className="font-medium text-white">Gamma Developers</span>
          </div>

          <p className="font-mono text-[10px] tracking-[0.16em] text-[#2fe85c] uppercase">
            Welcome back
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-[2.3rem]">
            Sign in to the platform
          </h2>
          <p className="mt-3 text-sm leading-6 text-white/40">
            Use the account created for your Gamma work email.
          </p>

          {params.reason === "access" ? (
            <div className="mt-8 rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-200" />
                <div>
                  <p className="text-sm font-medium text-amber-100">
                    Account access unavailable
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-amber-100/55">
                    This account does not have an active internal-platform
                    profile. Ask an owner to activate it, or sign in with a
                    different account.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {!configured ? (
            <div className="mt-8 rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] p-5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-200" />
                <div>
                  <p className="text-sm font-medium text-amber-100">
                    Supabase connection required
                  </p>
                  <p className="mt-1.5 text-sm leading-6 text-amber-100/55">
                    Add the project URL and publishable key to{" "}
                    <code className="text-amber-100/80">.env.local</code> before
                    signing in.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <LoginForm next={params.next} />
          )}
        </div>
      </section>
    </div>
  );
}
