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

// The stored fit is still honoured when rendering, so banners saved before the
// crop control was removed keep looking the way they were set. New banners take
// the default.
export type BannerFit = "cover" | "contain" | "fill";

export const BANNER_DEFAULT_FIT: BannerFit = "cover";

export function isBannerFit(value: string): value is BannerFit {
  return value === "cover" || value === "contain" || value === "fill";
}

export function bannerFitClass(fit: BannerFit) {
  if (fit === "contain") return "object-contain";
  if (fit === "fill") return "object-fill";
  return "object-cover";
}
