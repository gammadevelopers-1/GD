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

export const BANNER_MAX_BYTES = 8 * 1024 * 1024;

export const BANNER_TOO_LARGE = "Can't upload more than 8 MB pic";

export const BANNER_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const BANNER_ASPECT = 4;

export const BANNER_OUTPUT_WIDTH = 1600;

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
