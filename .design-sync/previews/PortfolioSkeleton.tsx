import { PortfolioSkeleton } from "gd-website";

export function Grid() {
  return (
    <div className="bg-background p-6" style={{ width: 760 }}>
      <PortfolioSkeleton view="grid" />
    </div>
  );
}

export function Table() {
  return (
    <div className="bg-background p-6" style={{ width: 900 }}>
      <PortfolioSkeleton view="table" />
    </div>
  );
}
