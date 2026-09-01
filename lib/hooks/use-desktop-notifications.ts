"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { notificationsSince } from "@/app/(admin)/notifications/actions";

export type PushPermission = "unsupported" | "default" | "granted" | "denied";

const POLL_MS = 60_000;

const listeners = new Set<() => void>();

function announce() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function snapshot(): PushPermission {
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission as PushPermission;
}

export function usePushPermission(): PushPermission {
  return useSyncExternalStore(
    subscribe,
    snapshot,
    () => "unsupported" as PushPermission,
  );
}

export async function askForPush(): Promise<PushPermission> {
  if (typeof Notification === "undefined") return "unsupported";

  try {
    const result = (await Notification.requestPermission()) as PushPermission;
    announce();
    return result;
  } catch {
    announce();
    return "denied";
  }
}

export function showPush(title: string, body?: string, href?: string | null) {
  if (typeof Notification === "undefined") return false;
  if (Notification.permission !== "granted") return false;

  try {
    const popup = new Notification(title, { body, icon: "/icon-64.png" });
    popup.onclick = () => {
      window.focus();
      if (href) window.location.assign(href);
      popup.close();
    };
    return true;
  } catch {
    return false;
  }
}

export function useDesktopNotifications(latestAt: string | null) {
  const router = useRouter();
  const permission = usePushPermission();
  const cursor = useRef(latestAt);
  const delivered = useRef(new Set<string>());

  useEffect(() => {
    if (permission !== "granted") return;

    let live = true;

    const check = async () => {
      const fresh = await notificationsSince(cursor.current);
      if (!live || !fresh.length) return;

      cursor.current = fresh[0].createdAt;
      let shown = false;

      for (const item of [...fresh].reverse()) {
        if (delivered.current.has(item.id)) continue;
        delivered.current.add(item.id);
        if (showPush(item.title, item.body ?? undefined, item.href)) {
          shown = true;
        }
      }

      if (shown) router.refresh();
    };

    const timer = window.setInterval(check, POLL_MS);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [permission, router]);
}
