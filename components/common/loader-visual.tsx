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
        "site-loader fixed inset-0 z-[999] overflow-hidden bg-[#090b0d] text-[#f4f4ee]",
        leaving && "site-loader-leaving",
        className,
      )}
    >
      <div aria-hidden className="loader-aurora absolute inset-0" />
      <div aria-hidden className="loader-grain absolute inset-0" />

      <div className="loader-topline absolute inset-x-0 top-0 z-2 flex items-center justify-between px-5 pt-5 font-mono text-[9px] tracking-[0.18em] text-white/48 uppercase sm:px-8 sm:pt-7">
        <span>Gamma Developers</span>
        <span className="flex items-center gap-2.5">
          <i className="loader-live-dot size-1.5 rounded-full bg-[#2fe85c] not-italic" />
          system start
        </span>
      </div>

      <div className="loader-stage relative z-1 flex h-full w-full items-center px-4 sm:px-8 lg:px-12">
        <div
          className="loader-word-shell relative w-full select-none"
          aria-label="Gamma"
        >
          <span className="loader-word loader-word-ghost block">GAMMA</span>
          <span
            aria-hidden
            className="loader-word loader-word-fill absolute inset-0 block"
          >
            GAMMA
          </span>
        </div>
      </div>

      <div
        aria-hidden
        className="loader-side-pill absolute top-1/2 right-4 z-2 hidden -translate-y-1/2 sm:right-7 sm:grid"
      >
        GD
      </div>

      <div className="loader-bottomline absolute inset-x-0 bottom-0 z-2 flex items-end justify-between gap-6 px-5 pb-5 sm:px-8 sm:pb-7">
        <div className="max-w-[22rem]">
          <span className="block font-mono text-[9px] tracking-[0.19em] text-white/44 uppercase">
            Preparing your experience
          </span>
          <span
            aria-hidden
            className="mt-2 block h-px w-[min(54vw,340px)] overflow-hidden bg-white/12"
          >
            <i className="loader-progress-bar block h-full bg-[#2fe85c]" />
          </span>
        </div>
        <span className="loader-percentage font-mono text-[clamp(22px,3vw,42px)] leading-none tracking-[-0.08em] tabular-nums">
          {String(safeProgress).padStart(3, "0")}
          <small className="ml-1 text-[0.34em] tracking-normal text-white/42">
            %
          </small>
        </span>
      </div>
    </div>
  );
}
