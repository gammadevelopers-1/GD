"use client";

import Link from "next/link";
import { LogOut, Settings, UserRound } from "lucide-react";
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
import { Button } from "@/components/ui/button";

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
        <Button
          variant="bare"
          size="none"
          type="button"
          aria-label={`${shown} — account menu`}
          className="cursor-pointer rounded-xl transition duration-200 hover:-translate-y-px focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none"
        >
          <Face
            initials={viewer.initials}
            url={avatarUrl}
            className="size-9.5 rounded-xl text-[11.5px]"
          />
        </Button>
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
            <p className="mt-0.5 font-mono text-[9px] tracking-[0.14em] text-black/35 uppercase">
              {ROLE_LABELS[viewer.role]}
            </p>
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
            <Button
              variant="bare"
              size="none"
              type="submit"
              className="flex w-full cursor-default items-center gap-2.5 text-left"
            >
              <LogOut className="size-4" />
              Sign out
            </Button>
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
