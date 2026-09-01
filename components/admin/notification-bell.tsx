"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  Bell,
  CalendarRange,
  FolderKanban,
  KeyRound,
  ListChecks,
  ShieldAlert,
  Star,
} from "lucide-react";
import { markNotificationsRead } from "@/app/(admin)/notifications/actions";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Inbox, NotificationKind } from "@/data/notifications";
import { timeAgo } from "@/lib/projects/format";
import { useDesktopNotifications } from "@/lib/hooks/use-desktop-notifications";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const ICONS: Record<NotificationKind, typeof Bell> = {
  env_access: KeyRound,
  project_member: FolderKanban,
  project_lead: Star,
  week_planned: CalendarRange,
  task_assigned: ListChecks,
  session_revoked: ShieldAlert,
};

export function NotificationBell({ inbox }: { inbox: Inbox }) {
  const [open, setOpen] = useState(false);
  const [, startReading] = useTransition();
  const [readHere, setReadHere] = useState<string[]>([]);

  useDesktopNotifications(inbox.items[0]?.createdAt ?? null);

  const shown = useMemo(() => {
    const marked = new Set(readHere);
    const items = inbox.items.map((item) =>
      item.read || marked.has(item.id) ? { ...item, read: true } : item,
    );
    return { items, unread: items.filter((item) => !item.read).length };
  }, [inbox, readHere]);

  function readAll() {
    const ids = inbox.items.map((item) => item.id);
    setReadHere((current) => [...new Set([...current, ...ids])]);
    startReading(() => markNotificationsRead());
  }

  function readOne(id: string) {
    setReadHere((current) => [...new Set([...current, id])]);
    startReading(() => markNotificationsRead([id]));
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="bare"
          size="none"
          type="button"
          aria-label={
            shown.unread
              ? `Notifications, ${shown.unread} unread`
              : "Notifications"
          }
          className="focus-visible:ring-gd-green/40 relative grid size-9.5 cursor-pointer place-items-center rounded-xl border border-black/[0.07] bg-white/55 text-black/55 transition duration-200 hover:border-black/[0.14] hover:bg-white hover:text-black focus-visible:ring-2 focus-visible:outline-none data-[state=open]:border-black/[0.14] data-[state=open]:bg-white"
        >
          <Bell className="size-4.5" strokeWidth={1.6} />
          {shown.unread ? (
            <span className="bg-gd-green absolute top-1.5 right-1.5 grid min-w-3.5 place-items-center rounded-full px-1 font-mono text-[8px] leading-3.5 font-semibold text-white tabular-nums">
              {shown.unread > 9 ? "9+" : shown.unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-88 p-0">
        <div className="flex items-center justify-between gap-3 border-b border-black/[0.07] px-3.5 py-2.5">
          <span className="font-mono text-[9px] tracking-[0.16em] text-black/35 uppercase">
            Notifications
          </span>
          {shown.unread ? (
            <Button
              variant="bare"
              size="none"
              type="button"
              onClick={readAll}
              className="text-gd-green-deep hover:text-gd-green-ink focus-visible:ring-gd-green/40 cursor-pointer rounded-md text-[11.5px] font-semibold transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
            >
              Mark all read
            </Button>
          ) : null}
        </div>

        {shown.items.length ? (
          <ul className="max-h-96 overflow-y-auto py-1">
            {shown.items.map((item) => {
              const Icon = ICONS[item.kind] ?? Bell;
              const row = (
                <>
                  <span
                    className={cn(
                      "mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg",
                      item.read
                        ? "bg-black/[0.05] text-black/40"
                        : "bg-brand/12 text-gd-green-deep",
                    )}
                  >
                    <Icon className="size-3.5" strokeWidth={1.7} />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-2">
                      <span
                        className={cn(
                          "min-w-0 flex-1 truncate text-[13px]",
                          item.read
                            ? "font-medium text-black/65"
                            : "font-semibold text-black/85",
                        )}
                      >
                        {item.title}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-black/35 tabular-nums">
                        {timeAgo(item.createdAt)}
                      </span>
                    </span>
                    {item.body ? (
                      <span className="mt-0.5 block text-[11.5px] leading-[1.45] text-black/45">
                        {item.body}
                      </span>
                    ) : null}
                  </span>

                  {item.read ? null : (
                    <span className="bg-gd-green mt-2 size-1.5 shrink-0 rounded-full" />
                  )}
                </>
              );

              const shared =
                "flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors duration-150 hover:bg-black/[0.03]";

              return (
                <li key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      onClick={() => {
                        setOpen(false);
                        if (!item.read) readOne(item.id);
                      }}
                      className={shared}
                    >
                      {row}
                    </Link>
                  ) : (
                    <Button
                      variant="bare"
                      size="none"
                      type="button"
                      onClick={() => readOne(item.id)}
                      className={cn(shared, "cursor-pointer")}
                    >
                      {row}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-3.5 py-8 text-center text-[12px] text-black/40">
            Nothing yet.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
