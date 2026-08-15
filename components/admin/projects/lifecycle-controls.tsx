"use client";

import { useState } from "react";
import { Archive, RotateCcw, X } from "lucide-react";

// Asks once first, because members lose access the moment it is archived
export function ArchiveControl({
  projectId,
  isArchived,
  archiveAction,
  restoreAction,
}: {
  projectId: string;
  isArchived: boolean;
  archiveAction: (formData: FormData) => Promise<void>;
  restoreAction: (formData: FormData) => Promise<void>;
}) {
  const [confirming, setConfirming] = useState(false);

  if (isArchived) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-amber-900">
          This project is archived
        </h2>
        <p className="mt-1.5 text-xs leading-5 text-amber-800/80">
          It is hidden from the portfolio and no assigned member can reach it.
          Its history is intact — restoring puts it back exactly as it was.
        </p>
        <form action={restoreAction} className="mt-4">
          <input type="hidden" name="projectId" value={projectId} />
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-900 px-4 text-xs font-semibold text-white transition duration-200 hover:bg-amber-950 hover:shadow-[0_10px_24px_rgba(120,53,15,0.25)] focus-visible:ring-2 focus-visible:ring-amber-700/50 focus-visible:outline-none active:scale-[0.98]"
          >
            <RotateCcw className="size-3.5" />
            Restore project
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white/50 p-4 transition-colors duration-200 hover:border-black/[0.14] sm:p-5">
      <h2 className="text-sm font-semibold">Archive this project</h2>
      <p className="mt-1.5 text-xs leading-5 text-black/45">
        Nothing is deleted. The project leaves the portfolio, assigned members
        lose access immediately, and an owner can restore it at any time.
      </p>

      {confirming ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <form action={archiveAction}>
            <input type="hidden" name="projectId" value={projectId} />
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-semibold text-white transition duration-200 hover:bg-red-700 hover:shadow-[0_10px_24px_rgba(220,38,38,0.28)] focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:outline-none active:scale-[0.98]"
            >
              <Archive className="size-3.5" />
              Yes, archive it
            </button>
          </form>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-xs font-medium text-black/50 transition duration-150 hover:bg-black/[0.045] hover:text-black focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none"
          >
            <X className="size-3.5" />
            Keep it
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-black/[0.12] bg-white px-4 text-xs font-semibold text-black/70 transition duration-200 hover:border-red-300 hover:bg-red-50/60 hover:text-red-700 focus-visible:ring-2 focus-visible:ring-red-400/40 focus-visible:outline-none active:scale-[0.98]"
        >
          <Archive className="size-3.5" />
          Archive project
        </button>
      )}
    </div>
  );
}
