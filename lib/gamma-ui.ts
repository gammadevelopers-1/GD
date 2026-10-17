/** Shared surface language for the home-page sections. */

export const cardLight =
  "border-line bg-surface rounded-[14px] border shadow-[0_1px_2px_rgba(20,23,26,0.05),0_28px_64px_-44px_rgba(20,23,26,0.4)]";

export const cardDark = "border-dark-line bg-dark-row rounded-[14px] border";

export const plateLight =
  "border-line bg-gd-panel text-green-ink grid place-items-center rounded-[10px] border transition-colors duration-300 ease-out group-hover:border-[rgba(13,119,40,0.28)] group-hover:bg-[rgba(13,119,40,0.06)]";

export const plateDark =
  "border-dark-line text-brand grid place-items-center rounded-[10px] border bg-white/[0.04] transition-colors duration-300 ease-out group-hover:border-brand/40 group-hover:bg-brand/10";

/** Green rail that wipes down a card's leading edge on hover. */
export const edgeBar =
  "bg-brand absolute top-0 bottom-0 left-0 w-[2px] origin-top scale-y-0 transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-y-100";
