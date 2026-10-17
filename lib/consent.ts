import { useSyncExternalStore } from "react";

/** What the visitor told the banner. */
export type Consent = "granted" | "denied";

/** "unanswered" means they have not been asked yet, or cleared the answer.
 *  "unknown" is the server's view: nothing can be read there, so anything
 *  that depends on the answer renders nothing until hydration. */
export type ConsentState = Consent | "unanswered" | "unknown";

const KEY = "gd-consent";
const CHANGED = "gd-consent-changed";
const REOPEN = "gd-consent-reopen";

/** localStorage rather than a cookie, deliberately: the record of a refusal
 *  should not itself be the thing being refused. It never leaves the browser. */
function read(): ConsentState {
  try {
    const value = window.localStorage.getItem(KEY);
    return value === "granted" || value === "denied" ? value : "unanswered";
  } catch {
    // Private window, or storage blocked. Treat as unasked rather than
    // assuming either answer.
    return "unanswered";
  }
}

export function setConsent(value: Consent | null) {
  try {
    if (value) window.localStorage.setItem(KEY, value);
    else window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to persist to. The event still fires so this page obeys the
    // choice; the next page load will ask again.
  }
  window.dispatchEvent(new Event(CHANGED));
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  // Answering it in another tab counts here too.
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribe, read, () => "unknown");
}

/** The footer link. Lets someone change an answer they already gave, which is
 *  the half of consent that sites usually leave out. */
export function reopenConsent() {
  window.dispatchEvent(new Event(REOPEN));
}

export function onReopen(listener: () => void) {
  window.addEventListener(REOPEN, listener);
  return () => window.removeEventListener(REOPEN, listener);
}
