import { PageHeadingSkeleton } from "gd-website";

export function WithAction() {
  return (
    <div className="bg-background p-8">
      <PageHeadingSkeleton action />
    </div>
  );
}

export function WithoutAction() {
  return (
    <div className="bg-background p-8">
      <PageHeadingSkeleton />
    </div>
  );
}
