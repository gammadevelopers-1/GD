export const LINK_LABEL_MAX = 80;
export const LINK_NOTES_MAX = 4000;

export function linkHref(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

export function linkDisplay(value: string) {
  return value.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}
