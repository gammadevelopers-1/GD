export type Device = {
  browser: string;
  platform: string;
  kind: "desktop" | "mobile" | "tablet" | "unknown";
};

const BROWSERS: Array<[RegExp, string]> = [
  [/\bEdgA?\/([\d.]+)/, "Edge"],
  [/\bOPR\/|\bOpera\b/, "Opera"],
  [/\bSamsungBrowser\//, "Samsung Internet"],
  [/\bBrave\//, "Brave"],
  [/\bVivaldi\//, "Vivaldi"],
  [/\bFirefox\/|\bFxiOS\//, "Firefox"],
  [/\bCriOS\//, "Chrome"],
  [/\bChrome\//, "Chrome"],
  [/\bSafari\//, "Safari"],
];

const PLATFORMS: Array<[RegExp, string]> = [
  [/\bWindows NT 10\.0.*\bWin64/, "Windows"],
  [/\bWindows NT\b/, "Windows"],
  [/\biPhone\b/, "iPhone"],
  [/\biPad\b/, "iPad"],
  [/\bAndroid\b/, "Android"],
  [/\bCrOS\b/, "ChromeOS"],
  [/\bMac OS X\b|\bMacintosh\b/, "macOS"],
  [/\bLinux\b|\bX11\b/, "Linux"],
];

export function readUserAgent(value: string | null): Device {
  if (!value) {
    return { browser: "Unknown browser", platform: "", kind: "unknown" };
  }

  const browser =
    BROWSERS.find(([pattern]) => pattern.test(value))?.[1] ??
    "Unknown browser";
  const platform = PLATFORMS.find(([pattern]) => pattern.test(value))?.[1] ?? "";

  const kind = /\biPad\b|\bTablet\b/.test(value)
    ? "tablet"
    : /\bMobi\b|\biPhone\b|\bAndroid\b/.test(value)
      ? "mobile"
      : platform
        ? "desktop"
        : "unknown";

  return { browser, platform, kind };
}

export function describeDevice(device: Device) {
  if (!device.platform) return device.browser;
  return `${device.browser} on ${device.platform}`;
}
