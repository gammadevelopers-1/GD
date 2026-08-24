"use client";

import { useActionState, useState } from "react";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PANEL, TONE_SOFT, type Tone } from "@/lib/admin-ui";
import {
  type MergeKey,
  type MergeState,
  mergeHeadline,
} from "@/lib/projects/env-merge";
import { IDLE_FORM, type SimpleFormState } from "@/lib/projects/form-state";
import { cn } from "@/lib/utils";

type AdoptAction = (
  state: SimpleFormState,
  formData: FormData,
) => Promise<SimpleFormState>;

const STATE_TONE: Record<MergeState, Tone> = {
  contested: "warning",
  absent: "info",
  agreed: "ok",
  settled: "muted",
};

const STATE_LABEL: Record<MergeState, string> = {
  contested: "Disagrees",
  absent: "Not in main",
  agreed: "Ready",
  settled: "In main",
};

export function EnvCompare({
  mainGroupId,
  keys,
  adopt,
}: {
  mainGroupId: string | null;
  keys: MergeKey[];
  adopt: AdoptAction;
}) {
  if (!keys.length) return null;

  return (
    <section className={cn(PANEL, "overflow-hidden")}>
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-black/[0.06] px-5 py-4">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.025em]">
          Main ENV
        </h2>
        <p className="font-mono text-[10.5px] tracking-[0.14em] text-black/40 uppercase tabular-nums">
          {mergeHeadline(keys)}
        </p>
      </header>

      <ul className="divide-y divide-black/[0.045]">
        {keys.map((entry) => (
          <KeyRow
            key={entry.key}
            entry={entry}
            mainGroupId={mainGroupId}
            adopt={adopt}
          />
        ))}
      </ul>
    </section>
  );
}

function KeyRow({
  entry,
  mainGroupId,
  adopt,
}: {
  entry: MergeKey;
  mainGroupId: string | null;
  adopt: AdoptAction;
}) {
  const needsChoice = entry.state === "contested" || entry.state === "absent";
  const [open, setOpen] = useState(false);
  const tone = STATE_TONE[entry.state];

  return (
    <li
      className={cn(
        "relative transition-colors duration-150",
        needsChoice ? "bg-amber-50/40" : "hover:bg-black/[0.012]",
      )}
    >
      {needsChoice ? (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-[2px] bg-amber-500"
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-5 py-3">
        <code className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-black">
          {entry.key}
        </code>

        {entry.main ? (
          <span
            aria-hidden
            className="hidden font-mono text-[11px] text-black/25 sm:inline"
          >
            ••••••••••
          </span>
        ) : null}

        <span
          className={cn(
            "rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase",
            TONE_SOFT[tone],
          )}
        >
          {STATE_LABEL[entry.state]}
        </span>

        {entry.main?.mainSourceCredentialId || entry.state === "settled" ? (
          <Provenance entry={entry} />
        ) : null}

        {needsChoice || entry.state === "agreed" ? (
          <Button
            variant="admin-ghost"
            size="admin-sm"
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((shown) => !shown)}
          >
            {entry.copyCount} {entry.copyCount === 1 ? "copy" : "copies"}
            <ChevronRight
              className={cn(
                "size-3.5 transition-transform duration-200",
                open && "rotate-90",
              )}
            />
          </Button>
        ) : null}
      </div>

      {open ? (
        <ul className="space-y-1 border-t border-black/[0.045] bg-white/60 px-5 py-3">
          {entry.candidates.map((candidate) => (
            <Candidate
              key={candidate.credentialId}
              variableKey={entry.key}
              candidate={candidate}
              mainGroupId={mainGroupId}
              adopt={adopt}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function Provenance({ entry }: { entry: MergeKey }) {
  const source = entry.candidates.find((candidate) => candidate.isCurrent);
  if (!source) return null;

  return (
    <span className="flex items-center gap-1.5 font-mono text-[10.5px] text-black/40">
      <span className="bg-brand size-1.5 rounded-full" />
      {source.holders[0]}
      <span className="text-black/25">{source.fingerprint}</span>
    </span>
  );
}

function Candidate({
  variableKey,
  candidate,
  mainGroupId,
  adopt,
}: {
  variableKey: string;
  candidate: MergeKey["candidates"][number];
  mainGroupId: string | null;
  adopt: AdoptAction;
}) {
  const [state, action, pending] = useActionState(adopt, IDLE_FORM);

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-1">
      <span className="font-mono text-[10.5px] text-black/35 tabular-nums">
        {candidate.fingerprint}
      </span>

      <span className="min-w-0 flex-1 truncate text-[12.5px] text-black/70">
        {candidate.holders.join(", ")}
      </span>

      {candidate.isCurrent ? (
        <span className="text-gd-green-deep flex items-center gap-1 font-mono text-[10px] tracking-[0.14em] uppercase">
          <Check className="size-3" />
          In main
        </span>
      ) : (
        <form action={action}>
          <input type="hidden" name="mainGroupId" value={mainGroupId ?? ""} />
          <input
            type="hidden"
            name="sourceCredentialId"
            value={candidate.credentialId}
          />
          <Button
            variant="admin-secondary"
            size="admin-sm"
            type="submit"
            disabled={pending || !mainGroupId}
            className="text-xs"
            aria-label={`Use ${candidate.holders[0]}'s ${variableKey}`}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            Use this
          </Button>
        </form>
      )}

      {state.status === "error" ? (
        <span className="w-full text-[11px] text-red-700">{state.message}</span>
      ) : null}
    </li>
  );
}
