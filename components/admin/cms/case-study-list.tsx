"use client";

import { useTransition } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  Archive,
  ExternalLink,
  Eye,
  EyeOff,
  Pencil,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveCaseStudy,
  moveCaseStudy,
  restoreCaseStudy,
  setCaseStatus,
} from "@/app/(admin)/cms/actions";
import type { CaseRecord } from "@/lib/cases/record";
import type { SimpleFormState } from "@/lib/projects/form-state";
import { cn } from "@/lib/utils";

const STATUS_STYLE: Record<CaseRecord["status"], string> = {
  published: "bg-green-600/10 text-green-800",
  draft: "bg-black/[0.055] text-black/50",
  archived: "bg-amber-600/10 text-amber-800",
};

const STATUS_LABEL: Record<CaseRecord["status"], string> = {
  published: "Live",
  draft: "Draft",
  archived: "Archived",
};

function Action({
  label,
  icon: Icon,
  onRun,
  busy,
  danger,
}: {
  label: string;
  icon: typeof Eye;
  onRun: () => Promise<SimpleFormState>;
  busy: boolean;
  danger?: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={pending || busy}
      onClick={() =>
        start(async () => {
          const result = await onRun();
          if (result.status === "error") toast.error(result.message ?? "");
          else toast.success(result.message ?? "");
        })
      }
      className={cn(
        "grid size-8 place-items-center rounded-[8px] border border-black/[0.08] text-black/55 transition-colors",
        "hover:border-black/20 hover:text-black disabled:opacity-40",
        danger && "hover:border-red-300 hover:text-red-700",
      )}
    >
      <Icon className="size-3.5" />
    </button>
  );
}

export function CaseStudyList({ records }: { records: readonly CaseRecord[] }) {
  const live = records.filter((row) => row.status !== "archived");

  return (
    <div className="overflow-hidden rounded-[20px] border border-black/[0.07] bg-gd-panel">
      {records.map((record, i) => {
        const { study } = record;
        const archived = record.status === "archived";

        return (
          <div
            key={record.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-black/[0.055] px-5 py-4 last:border-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold">{study.title}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[9px] font-semibold",
                    STATUS_STYLE[record.status],
                  )}
                >
                  {STATUS_LABEL[record.status]}
                </span>
                {study.named ? null : (
                  <span className="shrink-0 rounded-full bg-black/[0.045] px-2.5 py-1 text-[9px] font-semibold text-black/45">
                    Anonymous
                  </span>
                )}
              </div>
              <p className="mt-1 truncate font-mono text-[9px] text-black/35">
                /work/{study.slug} · {study.client || "no client set"}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {!archived && i > 0 ? (
                <Action
                  label="Move up"
                  icon={ArrowUp}
                  busy={false}
                  onRun={() => moveCaseStudy(record.id, "up")}
                />
              ) : null}
              {!archived && i < live.length - 1 ? (
                <Action
                  label="Move down"
                  icon={ArrowDown}
                  busy={false}
                  onRun={() => moveCaseStudy(record.id, "down")}
                />
              ) : null}

              {record.status === "published" ? (
                <>
                  <a
                    href={`/work/${study.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    title="View on the site"
                    aria-label="View on the site"
                    className="grid size-8 place-items-center rounded-[8px] border border-black/[0.08] text-black/55 transition-colors hover:border-black/20 hover:text-black"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                  <Action
                    label="Take off the site"
                    icon={EyeOff}
                    busy={false}
                    onRun={() => setCaseStatus(record.id, "draft")}
                  />
                </>
              ) : null}

              {record.status === "draft" ? (
                <Action
                  label="Put live"
                  icon={Eye}
                  busy={false}
                  onRun={() => setCaseStatus(record.id, "published")}
                />
              ) : null}

              {archived ? (
                <Action
                  label="Restore"
                  icon={Undo2}
                  busy={false}
                  onRun={() => restoreCaseStudy(record.id)}
                />
              ) : (
                <Action
                  label="Archive"
                  icon={Archive}
                  danger
                  busy={false}
                  onRun={() => archiveCaseStudy(record.id)}
                />
              )}

              <Link
                href={`/cms/${record.id}`}
                title="Edit"
                aria-label="Edit"
                className="grid size-8 place-items-center rounded-[8px] border border-black/[0.08] text-black/55 transition-colors hover:border-black/20 hover:text-black"
              >
                <Pencil className="size-3.5" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
