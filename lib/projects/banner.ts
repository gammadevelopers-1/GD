export type BannerFormState = {
  status: "idle" | "error" | "success";
  message: string | null;
  warning: string | null;
};

export const IDLE_BANNER: BannerFormState = {
  status: "idle",
  message: null,
  warning: null,
};

export const BANNER_FITS = {
  cover: "Crop",
  contain: "Fit",
  fill: "Fill",
} as const;

export type BannerFit = keyof typeof BANNER_FITS;

export const BANNER_FIT_ORDER: BannerFit[] = ["cover", "contain", "fill"];

export function isBannerFit(value: string): value is BannerFit {
  return value in BANNER_FITS;
}

export function bannerFitClass(fit: BannerFit) {
  if (fit === "contain") return "object-contain";
  if (fit === "fill") return "object-fill";
  return "object-cover";
}
