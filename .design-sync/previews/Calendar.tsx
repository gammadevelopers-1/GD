import { Calendar } from "gd-website";

export function Default() {
  return (
    <div className="flex justify-center bg-[#f8f8f3] p-6">
      <div className="rounded-2xl border border-black/[0.08] bg-white shadow-[0_18px_44px_rgba(20,23,26,0.07)]">
        <Calendar
          mode="single"
          selected={new Date(2026, 7, 21)}
          defaultMonth={new Date(2026, 7, 1)}
        />
      </div>
    </div>
  );
}

export function DateRange() {
  return (
    <div className="flex justify-center bg-[#f8f8f3] p-6">
      <div className="rounded-2xl border border-black/[0.08] bg-white shadow-[0_18px_44px_rgba(20,23,26,0.07)]">
        <Calendar
          mode="range"
          selected={{ from: new Date(2026, 7, 10), to: new Date(2026, 7, 21) }}
          defaultMonth={new Date(2026, 7, 1)}
        />
      </div>
    </div>
  );
}
