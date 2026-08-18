"use client";

import { RouteErrorState } from "@/components/errors/route-error-state";

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
