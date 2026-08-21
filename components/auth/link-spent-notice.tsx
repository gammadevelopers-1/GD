import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function LinkSpentNotice({
  signInHref,
  className = "mt-6",
}: {
  signInHref: string;
  className?: string;
}) {
  return (
    <div
      className={`${className} rounded-2xl border border-amber-300/15 bg-amber-300/[0.07] p-5`}
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-200" />
        <div>
          <p className="text-sm leading-6 text-amber-100/75">
            This link has already been used or has expired. If you have set your
            password, sign in below. Otherwise ask an owner to send a new one.
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
  );
}
