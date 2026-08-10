"use client";

import { useEffect, useState } from "react";
import { LoaderVisual } from "@/components/common/loader-visual";

export function SiteLoader() {
  const [stage, setStage] = useState<"visible" | "leaving" | "hidden">(
    "visible",
  );
  const [progress, setProgress] = useState(4);

  useEffect(() => {
    let cancelled = false;
    let exitTimer = 0;
    let hideTimer = 0;
    const startedAt = performance.now();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const progressTimer = window.setInterval(() => {
      const elapsed = performance.now() - startedAt;
      const normalized = Math.min(1, elapsed / 850);
      const eased = normalized * normalized * (3 - 2 * normalized);
      setProgress(Math.round(4 + eased * 90));
    }, 32);

    const minimum = new Promise<void>((resolve) =>
      window.setTimeout(resolve, 850),
    );
    const fonts = document.fonts?.ready ?? Promise.resolve();
    let onPageLoad: (() => void) | undefined;
    const pageLoad =
      document.readyState === "complete"
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            onPageLoad = () => resolve();
            window.addEventListener("load", onPageLoad, { once: true });
          });

    void Promise.all([minimum, fonts, pageLoad]).then(() => {
      if (cancelled) return;
      window.clearInterval(progressTimer);
      setProgress(100);
      exitTimer = window.setTimeout(() => {
        if (cancelled) return;
        setStage("leaving");
        document.body.style.overflow = previousOverflow;
        hideTimer = window.setTimeout(() => setStage("hidden"), 520);
      }, 140);
    });

    return () => {
      cancelled = true;
      window.clearInterval(progressTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(hideTimer);
      if (onPageLoad) window.removeEventListener("load", onPageLoad);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  if (stage === "hidden") return null;
  return <LoaderVisual progress={progress} leaving={stage === "leaving"} />;
}
