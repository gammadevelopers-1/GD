"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";

import { SectionHead } from "@/components/gamma/section-head";
import { calculator } from "@/lib/gamma-content";
import { cardLight } from "@/lib/gamma-ui";
import { cn } from "@/lib/utils";

/** Deterministic so the server and the browser format identically. */
function money(n: number) {
  return "$" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function num(n: number) {
  const rounded = Math.round(n * 100) / 100;
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))(?!\.\d)/g, ",");
}

type Result = { total: number; working: string; sub: string | null };

/**
 * Every formula is the arithmetic already written into lib/content/services.ts.
 * The working comes back with the total so the panel can show its own maths.
 */
function compute(id: string, [a, b, c]: number[]): Result {
  switch (id) {
    case "speed": {
      const missed = a * (b / 100);
      const monthly = missed * 0.2 * c;
      return {
        total: monthly * 12,
        sub: `${money(monthly)} a month`,
        working: `${num(a)} enquiries × ${num(b)}% missed = ${num(missed)} a month. Assuming one in five would have closed at ${money(c)}, that is ${money(monthly)} a month.`,
      };
    }
    case "docs": {
      const hours = (a * b) / 60;
      const monthly = hours * c;
      return {
        total: monthly * 12,
        sub: `${num(hours)} hours a month`,
        working: `${num(a)} documents × ${num(b)} minutes = ${num(hours)} hours a month. At ${money(c)} an hour that is ${money(monthly)} a month.`,
      };
    }
    case "followup": {
      const won = a * (b / 100);
      const quarterly = won * c;
      return {
        total: quarterly * 4,
        sub: `${money(quarterly)} a quarter`,
        working: `${num(a)} a quarter × ${num(b)}% won back = ${num(won)} people. At ${money(c)} each that is ${money(quarterly)} a quarter.`,
      };
    }
    case "reactivation": {
      const converts = a * (b / 100);
      return {
        total: converts * c,
        sub: `${num(converts)} conversations you already paid for`,
        working: `${num(a)} contacts × ${num(b)}% = ${num(converts)} conversions at ${money(c)} each.`,
      };
    }
    default: {
      const weekly = a * b * c;
      return {
        total: weekly * 52,
        sub: `${money(weekly)} a week`,
        working: `${num(a)} hours × ${num(b)} ${b === 1 ? "person" : "people"} × ${money(c)} an hour = ${money(weekly)} a week, across 52 weeks.`,
      };
    }
  }
}

export function CalculatorSection() {
  const [active, setActive] = useState(0);
  const [values, setValues] = useState<number[][]>(() =>
    calculator.presets.map((preset) => preset.inputs.map((i) => i.value)),
  );

  const preset = calculator.presets[active];
  const current = values[active];
  const { total, sub, working } = compute(preset.id, current);

  const setValue = (index: number, next: number) =>
    setValues((rows) =>
      rows.map((row, r) =>
        r === active ? row.map((v, i) => (i === index ? next : v)) : row,
      ),
    );

  return (
    <section id="calculator" className="bg-ground py-[clamp(60px,6vw,92px)]">
      <div className="mx-auto w-full max-w-[1280px] px-6">
        <SectionHead
          eyebrow={calculator.eyebrow}
          one={calculator.heading.one}
          two={calculator.heading.two}
          lead={calculator.lead}
        />

        <div
          role="tablist"
          aria-label="Which leak to price"
          className="border-line bg-gd-panel -mx-6 mt-[clamp(36px,3.8vw,56px)] flex [scrollbar-width:none] gap-1 overflow-x-auto rounded-full border p-1.5 px-1.5 sm:mx-0 sm:w-fit [&::-webkit-scrollbar]:hidden"
        >
          {calculator.presets.map((item, i) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active === i}
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-[13.5px] font-medium transition-all duration-200 ease-out",
                "focus-visible:outline-ink focus-visible:outline-2 focus-visible:outline-offset-2",
                active === i
                  ? "bg-surface text-ink shadow-[0_1px_2px_rgba(20,23,26,0.08),0_6px_16px_-10px_rgba(20,23,26,0.5)]"
                  : "text-dim hover:text-ink",
              )}
            >
              {item.tab}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className={cn(cardLight, "p-[clamp(24px,2.6vw,38px)]")}>
            <p className="t-eyebrow text-dim">{preset.caption}</p>

            <div className="mt-8 flex flex-col gap-8">
              {preset.inputs.map((input, i) => {
                const value = current[i];
                const pct =
                  ((value - input.min) / (input.max - input.min)) * 100;
                const prefix = "prefix" in input ? input.prefix : "";
                const suffix = "suffix" in input ? input.suffix : "";

                return (
                  <label key={input.label} className="block">
                    <span className="flex items-center justify-between gap-4">
                      <span className="t-body text-ink-soft">
                        {input.label}
                      </span>
                      <span className="text-green-ink font-display rounded-full bg-[rgba(13,119,40,0.08)] px-3 py-[5px] text-[17px] leading-none font-bold tabular-nums">
                        {prefix}
                        {num(value)}
                        {suffix}
                      </span>
                    </span>

                    <input
                      type="range"
                      className="calc-range mt-3.5"
                      style={
                        { "--calc-fill": `${pct}%` } as React.CSSProperties
                      }
                      min={input.min}
                      max={input.max}
                      step={input.step}
                      value={value}
                      onChange={(e) => setValue(i, Number(e.target.value))}
                    />

                    <span className="text-faint mt-1.5 flex justify-between font-mono text-[10px] tracking-[0.1em]">
                      <span>
                        {prefix}
                        {num(input.min)}
                        {suffix}
                      </span>
                      <span>
                        {prefix}
                        {num(input.max)}
                        {suffix}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-[15px] bg-[linear-gradient(150deg,rgba(47,232,92,0.55),rgba(255,255,255,0.14)_28%,rgba(255,255,255,0.05)_62%,rgba(47,232,92,0.28))] p-px shadow-[0_2px_4px_rgba(20,23,26,0.08),0_36px_72px_-40px_rgba(20,23,26,0.7)]">
            <div className="relative flex h-full flex-col overflow-hidden rounded-[14px] bg-[linear-gradient(160deg,#1e2228,#191c21_54%,#15181c)] p-[clamp(24px,2.6vw,38px)]">
              <span
                aria-hidden
                className="pointer-events-none absolute -top-28 -right-16 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(47,232,92,0.2),transparent_70%)]"
              />

              <p className="t-eyebrow text-dim-dark relative">
                Leaking, on your numbers
              </p>

              <p
                aria-live="polite"
                className="font-display text-brand relative mt-6 text-[clamp(48px,6.4vw,82px)] leading-[0.86] font-bold tracking-[-0.05em] tabular-nums"
              >
                {money(total)}
              </p>

              <p className="t-eyebrow text-dark-body relative mt-4">
                {preset.cadence}
                {sub ? <span className="text-dim-dark"> · {sub}</span> : null}
              </p>

              <p className="t-body text-dark-body relative mt-7 rounded-[10px] border border-white/8 bg-white/[0.035] p-4 text-pretty">
                {working}
              </p>

              <p className="text-dim-dark relative mt-4 text-[11px] leading-[1.6]">
                {calculator.note}
              </p>

              <div className="relative mt-auto pt-[clamp(26px,3vw,38px)]">
                <a
                  href={calculator.cta.href}
                  className="bg-brand text-ink hover:bg-brand-hover focus-visible:outline-brand group inline-flex h-[50px] items-center gap-2.5 rounded-full px-6 text-[15px] font-semibold transition-colors duration-200 ease-out focus-visible:outline-2 focus-visible:outline-offset-[3px]"
                >
                  {calculator.cta.label}
                  <ArrowRight
                    aria-hidden
                    className="size-[18px] transition-transform duration-200 ease-out group-hover:translate-x-1"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
