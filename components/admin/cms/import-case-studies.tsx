"use client";

import { useTransition } from "react";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { importCaseStudies } from "@/app/(admin)/cms/actions";

/** One-time lift of the case studies written in the repo into the console,
 *  so nobody has to retype five finished case studies into a form. */
export function ImportCaseStudies() {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const result = await importCaseStudies();
          if (result.status === "error") toast.error(result.message ?? "");
          else toast.success(result.message ?? "");
        })
      }
      className="inline-flex h-10 items-center gap-2 rounded-full bg-black px-5 text-[13px] font-semibold text-white transition-colors hover:bg-black/85 disabled:opacity-50"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      Import the existing case studies
    </button>
  );
}
