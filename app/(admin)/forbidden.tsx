import { RouteErrorState } from "@/components/errors/route-error-state";

export default function Forbidden() {
  return <RouteErrorState kind="forbidden" embedded />;
}
