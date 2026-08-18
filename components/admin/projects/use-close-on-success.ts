"use client";

import { useEffect, useRef } from "react";

export function useCloseOnSuccess(
  state: { status: "idle" | "error" | "success" },
  close: () => void,
) {
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  });
  useEffect(() => {
    if (state.status === "success") closeRef.current();
  }, [state]);
}
