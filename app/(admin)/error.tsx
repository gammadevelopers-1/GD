"use client";

import { RouteErrorState } from "@/components/errors/route-error-state";

// The unexpected-error state for the whole admin group. The message itself is
// never rendered — it can carry internals, and a query that failed while
// reading credentials is exactly the wrong thing to print on a screen.
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorState
      kind="error"
      embedded
      reset={reset}
      reference={error.digest}
    />
  );
}
