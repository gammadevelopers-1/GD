import Link from "next/link";
import { Mark } from "@/components/layout/mark";

export default function PortalNotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-16">
      <div className="w-full max-w-sm">
        <Mark />
        <h1 className="font-display mt-6 text-xl font-semibold tracking-[-0.03em]">
          Not available
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-black/50">
          This page is not shared with your account.
        </p>
        <Link
          href="/portal"
          className="mt-6 inline-flex text-[13px] font-medium text-[#08743d] hover:underline"
        >
          Your projects
        </Link>
      </div>
    </main>
  );
}
