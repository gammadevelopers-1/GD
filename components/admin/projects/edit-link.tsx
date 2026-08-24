"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { Pencil } from "lucide-react";
import { isProjectTab } from "@/lib/projects/tabs";

export function EditProjectLink({ publicId }: { publicId: string }) {
  const segment = useSelectedLayoutSegment();
  const from = isProjectTab(segment ?? "overview")
    ? (segment ?? "overview")
    : "overview";

  return (
    <Link
      href={`/projects/${publicId}/edit?from=${from}`}
      className="focus-visible:ring-brand/45 inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.08] px-3.5 text-xs font-semibold text-white transition duration-200 hover:bg-white/[0.16] hover:shadow-[0_8px_20px_rgba(0,0,0,0.25)] focus-visible:ring-2 focus-visible:outline-none active:scale-[0.97]"
    >
      <Pencil className="size-3.5" />
      Edit
    </Link>
  );
}
