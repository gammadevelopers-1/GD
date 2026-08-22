import "server-only";

import { cache } from "react";

export const PERF_TIMING = process.env.GD_PERF_TIMING === "1";

const PERF_LATENCY = Number(process.env.GD_PERF_LATENCY ?? "0");

type RequestPerf = {
  startedAt: number;
  calls: number;
  dbMs: number;
  depth: number;
};

const requestPerf = cache((): RequestPerf => ({
  startedAt: performance.now(),
  calls: 0,
  dbMs: 0,
  depth: 0,
}));

function endpoint(raw: string) {
  try {
    const url = new URL(raw);
    const table = url.pathname.replace(/^\/rest\/v1\//, "");
    const select = url.searchParams.get("select") ?? "";
    const filters = [...url.searchParams.entries()]
      .filter(([key]) => key !== "select")
      .map(([key, value]) => `${key}=${value.slice(0, 24)}`)
      .join("&");
    return `${table}${filters ? `?${filters}` : ""}${select ? ` [${select.length}c]` : ""}`;
  } catch {
    return raw.slice(0, 120);
  }
}

function requestUrl(input: RequestInfo | URL) {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

function requestMethod(input: RequestInfo | URL, init?: RequestInit) {
  if (init?.method) return init.method;
  if (input instanceof Request) return input.method;
  return "GET";
}

export function createTimedFetch(): typeof fetch | undefined {
  if (!PERF_TIMING) return undefined;

  return async (input: RequestInfo | URL, init?: RequestInit) => {
    const state = requestPerf();
    if (state.calls === 0)
      console.log("[perf] \u2500\u2500 request \u2500\u2500");
    const started = performance.now();
    const openedAt = started - state.startedAt;
    try {
      if (PERF_LATENCY > 0) {
        await new Promise((resolve) => setTimeout(resolve, PERF_LATENCY));
      }
      return await fetch(input, init);
    } finally {
      const elapsed = performance.now() - started;
      const closedAt = openedAt + elapsed;
      state.calls += 1;
      state.dbMs += elapsed;
      console.log(
        `[perf] db  ${elapsed.toFixed(0).padStart(5)}ms  #${String(state.calls).padStart(2)}  t=${openedAt.toFixed(0).padStart(5)}->${closedAt.toFixed(0).padStart(5)}  ${requestMethod(input, init).padEnd(6)} ${endpoint(requestUrl(input))}`,
      );
    }
  };
}

export async function perfSpan<T>(
  label: string,
  run: () => Promise<T>,
): Promise<T> {
  if (!PERF_TIMING) return run();

  const state = requestPerf();
  const callsBefore = state.calls;
  const dbBefore = state.dbMs;
  const started = performance.now();
  state.depth += 1;

  try {
    return await run();
  } finally {
    state.depth -= 1;
    const total = performance.now() - started;
    const db = state.dbMs - dbBefore;
    const calls = state.calls - callsBefore;
    console.log(
      `[perf] ${"  ".repeat(state.depth)}▸ ${label}  ${total.toFixed(0)}ms total  ${calls} calls  ${db.toFixed(0)}ms db  ${(total - db).toFixed(0)}ms other`,
    );
  }
}

export function perfWrap<A extends unknown[], R>(
  label: string,
  run: (...args: A) => Promise<R>,
): (...args: A) => Promise<R> {
  if (!PERF_TIMING) return run;
  return (...args: A) => perfSpan(label, () => run(...args));
}
