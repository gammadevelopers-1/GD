import { RouteErrorState } from "gd-website";

export function NotFound() {
  return <RouteErrorState kind="not-found" />;
}

export function Forbidden() {
  return <RouteErrorState kind="forbidden" />;
}

export function ServerError() {
  return (
    <RouteErrorState kind="error" reset={() => {}} reference="req_8f31c0a4" />
  );
}
