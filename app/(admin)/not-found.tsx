import { RouteErrorState } from "@/components/errors/route-error-state";

export default function AdminNotFound() {
  return <RouteErrorState kind="not-found" embedded />;
}
