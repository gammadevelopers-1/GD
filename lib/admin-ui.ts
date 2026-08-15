// Shared hover and focus styles, so a button feels the same on every tab.
export const FOCUS_RING =
  "focus-visible:ring-2 focus-visible:ring-[#16a34a]/40 focus-visible:outline-none";

export const FOCUS_RING_DARK =
  "focus-visible:ring-2 focus-visible:ring-[#2fe85c]/45 focus-visible:outline-none";

export const PANEL =
  "rounded-[20px] border border-black/[0.07] bg-[#f8f8f3] transition-colors duration-200";

export const CARD_HOVER =
  "transition duration-200 hover:-translate-y-0.5 hover:border-black/[0.12] hover:shadow-[0_18px_44px_rgba(20,23,26,0.07)]";

export const ROW_HOVER = "transition-colors duration-150 hover:bg-white/70";

export const ICON_BUTTON = `grid size-7 place-items-center rounded-lg text-black/35 transition duration-150 hover:bg-black/[0.05] hover:text-black active:scale-95 ${FOCUS_RING}`;

export const ICON_BUTTON_DANGER = `grid size-7 place-items-center rounded-lg text-black/35 transition duration-150 hover:bg-red-50 hover:text-red-700 active:scale-95 ${FOCUS_RING}`;

export const BUTTON_PRIMARY = `inline-flex items-center justify-center gap-2 rounded-xl bg-[#15181b] px-4 text-sm font-semibold text-white transition duration-200 hover:bg-black hover:shadow-[0_10px_24px_rgba(20,23,26,0.18)] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${FOCUS_RING}`;

export const BUTTON_SECONDARY = `inline-flex items-center justify-center gap-2 rounded-xl border border-black/[0.1] bg-white px-4 text-sm font-medium text-black/65 transition duration-200 hover:border-black/25 hover:text-black active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60 ${FOCUS_RING}`;

export const BUTTON_GHOST = `inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-black/45 transition duration-150 hover:bg-black/[0.045] hover:text-black active:scale-[0.98] ${FOCUS_RING}`;

export const BUTTON_DANGER = `inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 text-xs font-semibold text-white transition duration-200 hover:bg-red-700 hover:shadow-[0_8px_20px_rgba(220,38,38,0.25)] active:scale-[0.98] ${FOCUS_RING}`;

export const INPUT = `w-full rounded-xl border border-black/[0.09] bg-white px-3 text-sm outline-none transition duration-150 placeholder:text-black/30 hover:border-black/20 focus:border-[#16a34a] focus-visible:ring-2 focus-visible:ring-[#16a34a]/20`;

export const INPUT_SMALL = `rounded-lg border border-black/[0.09] bg-white px-2.5 text-xs outline-none transition duration-150 placeholder:text-black/30 hover:border-black/20 focus:border-[#16a34a] focus-visible:ring-2 focus-visible:ring-[#16a34a]/20`;

// Hidden until you hover on desktop, always visible on touch screens.
export const REVEAL_ON_HOVER =
  "opacity-100 transition-opacity duration-150 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100";

export const DASHED_ACTION = `flex w-full items-center justify-center gap-2 rounded-[20px] border border-dashed border-black/12 bg-white/40 px-4 py-4 text-xs font-semibold text-black/50 transition duration-200 hover:border-[#2fe85c]/60 hover:bg-[#2fe85c]/[0.06] hover:text-[#08743d] active:scale-[0.995] ${FOCUS_RING}`;
