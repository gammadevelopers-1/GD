import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function LoaderVisual({
  leaving = false,
  progress = 58,
  className,
}: {
  leaving?: boolean;
  progress?: number;
  className?: string;
}) {
  const safeProgress = Math.min(100, Math.max(0, Math.round(progress)));
  const loaderStyle = {
    "--loader-progress": `${safeProgress}%`,
  } as CSSProperties;

  return (
    <div
      role="progressbar"
      aria-label="Loading Gamma Developers"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={safeProgress}
      style={loaderStyle}
      className={cn(
        "site-loader fixed inset-0 z-[999] grid place-items-center overflow-hidden bg-[#141815] text-[#eef1ed]",
        leaving && "site-loader-leaving",
        className,
      )}
    >
      <div aria-hidden className="loader-grid absolute inset-0" />

      <div className="loader-stage relative z-1 flex w-[min(84vw,420px)] flex-col items-center text-center">
        <div className="loader-word-shell select-none" aria-label="Gamma">
          <span aria-hidden className="loader-word font-display block">
            GAMMA
          </span>
        </div>

        <span aria-hidden className="loader-progress-track mt-5 block w-full">
          <i className="loader-progress-bar loader-progress-bar-left" />
          <i className="loader-progress-bar loader-progress-bar-right" />
        </span>
      </div>
    </div>
  );
}
