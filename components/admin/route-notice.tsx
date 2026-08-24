"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/components/ui/sonner";
import { readNotice } from "@/lib/projects/notices";

export function RouteNotice() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const shown = useRef<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const key = params.get("notice");
    if (!key) {
      shown.current = null;
      return;
    }

    if (shown.current !== key) {
      shown.current = key;
      const notice = readNotice(key);
      if (notice) {
        const show = notice.tone === "ok" ? toast.success : toast.warning;
        show(notice.title, { description: notice.description });
      }
    }

    params.delete("notice");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [search, pathname, router]);

  return null;
}
