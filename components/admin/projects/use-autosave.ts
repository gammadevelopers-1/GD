"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SimpleFormState } from "@/lib/projects/form-state";

export type AutosaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export function useAutosave(
  perform: () => Promise<SimpleFormState>,
  delay = 900,
) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const performRef = useRef(perform);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);
  const queued = useRef(false);
  const dirty = useRef(false);

  useEffect(() => {
    performRef.current = perform;
  });

  const run = useCallback(async () => {
    if (running.current) {
      queued.current = true;
      return;
    }
    running.current = true;
    do {
      queued.current = false;
      dirty.current = false;
      setStatus("saving");
      setMessage(null);
      let result: SimpleFormState;
      try {
        result = await performRef.current();
      } catch {
        result = {
          status: "error",
          message: "Could not save. Check your connection.",
        };
      }
      if (!queued.current) {
        if (result.status === "error") {
          setStatus("error");
          setMessage(result.message ?? "Could not save.");
        } else {
          setStatus("saved");
        }
      }
    } while (queued.current);
    running.current = false;
  }, []);

  const schedule = useCallback(() => {
    dirty.current = true;
    setStatus("dirty");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      void run();
    }, delay);
  }, [delay, run]);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (dirty.current) void run();
  }, [run]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { status, message, schedule, flush };
}
