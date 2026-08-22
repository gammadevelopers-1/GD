import { DeliveryPulse } from "gd-website";

export function Default() {
  return (
    <div className="max-w-sm bg-[#f8f8f3] p-6">
      <DeliveryPulse
        weeks={[
          { label: "6w ago", done: 4, total: 6 },
          { label: "5w ago", done: 5, total: 5 },
          { label: "4w ago", done: 2, total: 6 },
          { label: "3w ago", done: 6, total: 6 },
          { label: "2w ago", done: 3, total: 5 },
          { label: "Now", done: 5, total: 7 },
        ]}
      />
    </div>
  );
}

export function Quiet() {
  return (
    <div className="max-w-sm bg-[#f8f8f3] p-6">
      <DeliveryPulse
        weeks={[
          { label: "6w ago", done: 0, total: 4 },
          { label: "5w ago", done: 0, total: 4 },
          { label: "4w ago", done: 0, total: 4 },
          { label: "3w ago", done: 0, total: 4 },
          { label: "2w ago", done: 0, total: 4 },
          { label: "Now", done: 0, total: 4 },
        ]}
      />
    </div>
  );
}
