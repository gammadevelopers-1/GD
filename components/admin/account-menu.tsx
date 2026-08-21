"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS } from "@/lib/team/records";
import type { Viewer } from "@/data/auth";
import { cn } from "@/lib/utils";

export function AccountMenu({
  viewer,
  avatarUrl,
}: {
  viewer: Viewer;
  avatarUrl: string | null;
}) {
  const shown = viewer.displayName ?? viewer.fullName;
  const alsoKnownAs =
    viewer.displayName && viewer.displayName !== viewer.fullName
      ? viewer.fullName
      : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2.5 rounded-xl border border-black/[0.07] bg-white/55 p-1.5 pr-2.5 transition hover:border-black/[0.14] hover:bg-white/80 focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none data-[state=open]:border-black/[0.14] data-[state=open]:bg-white"
        >
          <Face initials={viewer.initials} url={avatarUrl} className="size-7" />

          <span className="hidden min-w-0 text-left leading-none sm:block">
            <span className="block max-w-32 truncate text-[11.5px] font-semibold">
              {shown}
            </span>
            <span className="mt-1 block text-[9px] text-black/40">
              {ROLE_LABELS[viewer.role]}
            </span>
          </span>

          <ChevronDown className="size-3.5 shrink-0 text-black/30 transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <div className="flex items-center gap-3 px-2 py-2">
          <Face
            initials={viewer.initials}
            url={avatarUrl}
            className="size-9 rounded-xl"
          />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold">{shown}</p>
            <p className="truncate text-[11px] text-black/45">{viewer.email}</p>
            {alsoKnownAs ? (
              <p className="mt-0.5 truncate font-mono text-[10px] text-black/35">
                {alsoKnownAs}
              </p>
            ) : null}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/profile" className="gap-2.5">
            <UserRound className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/settings" className="gap-2.5">
            <Settings className="size-4" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full cursor-default items-center gap-2.5 text-left"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Face({
  initials,
  url,
  className,
}: {
  initials: string;
  url: string | null;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-lg bg-[#15181b] text-[10px] font-semibold text-[#2fe85c]",
        className,
      )}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        initials
      )}
    </span>
  );
}
