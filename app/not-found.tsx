import { RouteErrorState } from "@/components/errors/route-error-state";

export default function NotFound() {
  return <RouteErrorState kind="not-found" />;
}
