"use client";

import { useEffect, useRef, useState } from "react";
import {
  AudioLines,
  CalendarCheck,
  ChartColumn,
  FileText,
  LayoutGrid,
  MessageSquare,
  PlayCircle,
  Power,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import { CORE, PANELS, STAGE, branch, type Panel } from "@/lib/hero-os";
import { ScrollTrigger, gsap, useGSAP } from "@/lib/gsap";
import { cn } from "@/lib/utils";

const ACCENT = "#2FE85C";
const OFF_LINE = "rgba(255,255,255,.14)";
const ON_LINE = "rgba(47,232,92,.45)";

const PANEL_ICONS = {
  search: Search,
  calendar: CalendarCheck,
  play: PlayCircle,
  grid: LayoutGrid,
  chat: MessageSquare,
  voice: AudioLines,
  users: Users,
  chart: ChartColumn,
  doc: FileText,
  power: Power,
} as const;

/** Abstract UI, never real words — the panels read as interfaces, not copy. */
function Body({ kind }: { kind: Panel["kind"] }) {
  const bar = (w: string, accent = false) => (
    <span
      data-fill={accent ? "" : undefined}
      className="block h-[5px] rounded-full"
      style={{ width: w, background: accent ? ACCENT : OFF_LINE }}
    />
  );

  switch (kind) {
    case "search":
      return (
        <div className="flex h-full items-center gap-2.5">
          <span className="h-[26px] flex-1 rounded-full border border-current/20 border-white/10" />
          <span className="size-[10px] rounded-full border border-white/25" />
        </div>
      );
    case "lines":
      return (
        <div className="flex h-full flex-col justify-center gap-[7px]">
          {bar("100%", true)}
          {bar("74%")}
          {bar("52%")}
        </div>
      );
    case "player":
      return (
        <div className="flex h-full items-center gap-3">
          <span className="grid size-[34px] place-items-center rounded-full border border-white/15">
            <span
              className="ml-[2px] block h-0 w-0"
              style={{
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                borderLeft: `9px solid ${OFF_LINE}`,
              }}
            />
          </span>
          <span className="flex flex-1 flex-col gap-[7px]">
            {bar("100%", true)}
            {bar("62%")}
          </span>
        </div>
      );
    case "grid":
      return (
        <div className="grid h-full grid-cols-3 grid-rows-2 gap-[6px]">
          {Array.from({ length: 6 }, (_, i) => (
            <span
              key={i}
              data-fill={i === 1 ? "" : undefined}
              className="rounded-[4px]"
              style={{ background: i === 1 ? ACCENT : "rgba(255,255,255,.07)" }}
            />
          ))}
        </div>
      );
    case "chat":
      return (
        <div className="flex h-full flex-col justify-center gap-[8px]">
          <span className="flex items-center gap-2">
            <span className="size-[18px] rounded-[6px] border border-white/15" />
            {bar("58%", true)}
          </span>
          {bar("86%")}
          {bar("44%")}
        </div>
      );
    case "wave":
      return (
        <div className="flex h-full items-center justify-between gap-[3px]">
          {[9, 17, 26, 14, 30, 20, 11, 24, 16, 28, 13, 19].map((h, i) => (
            <span
              key={i}
              data-fill={i === 4 ? "" : undefined}
              className="w-[3px] rounded-full"
              style={{ height: h, background: i === 4 ? ACCENT : OFF_LINE }}
            />
          ))}
        </div>
      );
    case "avatars":
      return (
        <div className="flex h-full flex-col justify-center gap-[9px]">
          <span className="flex gap-[6px]">
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                data-fill={i === 0 ? "" : undefined}
                className="size-[18px] rounded-full"
                style={{
                  background: i === 0 ? ACCENT : "rgba(255,255,255,.09)",
                }}
              />
            ))}
          </span>
          {bar("78%")}
        </div>
      );
    case "chart":
      return (
        <div className="flex h-full items-end gap-[7px]">
          {[20, 34, 26, 46, 30].map((h, i) => (
            <span
              key={i}
              data-fill={i === 3 ? "" : undefined}
              className="flex-1 rounded-[3px]"
              style={{ height: h, background: i === 3 ? ACCENT : OFF_LINE }}
            />
          ))}
        </div>
      );
    case "toggle":
      return (
        <div className="flex h-full items-center gap-3">
          <span className="flex h-[16px] w-[30px] items-center rounded-full border border-white/15 px-[3px]">
            <span
              data-fill
              className="ml-auto size-[9px] rounded-full"
              style={{ background: ACCENT }}
            />
          </span>
          <span className="flex flex-1 flex-col gap-[6px]">{bar("70%")}</span>
        </div>
      );
    case "doc":
      return (
        <div className="flex h-full flex-col justify-center gap-[7px]">
          {bar("100%")}
          {bar("88%", true)}
          {bar("94%")}
          {bar("60%")}
        </div>
      );
  }
}

export function HeroOs({ className }: { className?: string }) {
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Cover, not fit — the composition fills the hero and clips at the edges.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect;
      setScale(Math.max(width / STAGE.w, height / STAGE.h) * 0.72);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const panels = gsap.utils.toArray<HTMLElement>("[data-panel]");

        panels.forEach((el) => {
          gsap.set(el, {
            x: Number(el.dataset.dx),
            y: Number(el.dataset.dy),
            opacity: 0,
            scale: 0.42,
          });
        });
        gsap.set("[data-fill]", { opacity: 0.32 });
        gsap.set("[data-branch]", { strokeDashoffset: 1 });
        gsap.set("[data-flow]", { opacity: 0 });
        gsap.set("[data-halo]", { opacity: 0, scale: 0.7 });
        gsap.set("[data-wash]", { opacity: 0 });
        gsap.set("[data-core-icon]", { color: "#4b525a" });

        const tl = gsap.timeline({ paused: true });

        tl.to("[data-core]", {
          borderColor: ACCENT,
          boxShadow: "0 0 70px rgba(47,232,92,.28)",
          scale: 1.08,
          duration: 0.3,
        })
          .to("[data-core-icon]", { color: ACCENT, duration: 0.3 }, 0)
          .fromTo(
            "[data-halo]",
            { scale: 0.7, opacity: 0 },
            { scale: 1.5, opacity: 0.38, duration: 0.6, ease: "power2.out" },
            0,
          )
          .to("[data-halo]", { opacity: 0, duration: 0.5 }, 0.6)
          .to("[data-core]", { scale: 1, duration: 0.4 }, 0.3);

        // Panels surface out of the core and settle into place.
        panels.forEach((el, i) => {
          const at = 0.45 + i * 0.11;
          tl.to(el, { opacity: 1, scale: 0.72, duration: 0.2 }, at).to(
            el,
            { x: 0, y: 0, scale: 1, duration: 0.7, ease: "power3.out" },
            at + 0.1,
          );
        });

        const settled = 0.45 + panels.length * 0.11 + 0.8;
        tl.to(
          "[data-branch]",
          {
            strokeDashoffset: 0,
            duration: 0.7,
            ease: "power2.inOut",
            stagger: 0.07,
          },
          settled,
        )
          .to(
            "[data-panel]",
            { borderColor: ON_LINE, duration: 0.5, stagger: 0.06 },
            settled + 0.2,
          )
          .to(
            "[data-fill]",
            { opacity: 1, duration: 0.4, stagger: 0.05 },
            settled + 0.3,
          )
          .to(
            "[data-head]",
            { color: "#ffffff", duration: 0.4, stagger: 0.05 },
            settled + 0.3,
          );

        const done = settled + 1.2;
        tl.to(
          "[data-wash]",
          { opacity: 1, duration: 1.4, ease: "power2.out" },
          done - 0.3,
        );
        tl.to("[data-flow]", { opacity: 1, duration: 0.6 }, done).call(
          () => {
            panels.forEach((el) => {
              gsap.to(el, {
                y: -7,
                duration: Number(el.dataset.beat),
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1,
              });
            });
          },
          undefined,
          done,
        );

        const st = ScrollTrigger.create({
          trigger: stage.current,
          start: "top 80%",
          onEnter: () => gsap.delayedCall(0.4, () => tl.play()),
        });

        return () => {
          st.kill();
          tl.kill();
        };
      });

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-panel]", {
          x: 0,
          y: 0,
          opacity: 1,
          scale: 1,
          borderColor: ON_LINE,
        });
        gsap.set("[data-branch]", { strokeDashoffset: 0 });
        gsap.set("[data-wash]", { opacity: 1 });
        gsap.set("[data-head]", { color: "#ffffff" });
        gsap.set("[data-core-icon]", { color: ACCENT });
        gsap.set("[data-core]", {
          borderColor: ACCENT,
          boxShadow: "0 0 70px rgba(47,232,92,.28)",
        });
      });

      return () => mm.revert();
    },
    { scope: stage },
  );

  return (
    <div ref={stage} aria-hidden className={cn("overflow-hidden", className)}>
      {/* Light blooms in from the right once the system is up. */}
      <div
        data-wash
        className="absolute inset-0 bg-[radial-gradient(86%_140%_at_104%_46%,rgba(212,236,220,0.29)_0%,rgba(132,184,150,0.16)_34%,rgba(48,70,56,0.075)_60%,transparent_86%)] opacity-0"
      />

      <div
        className="absolute top-1/2 left-1/2 origin-center"
        style={{
          width: STAGE.w,
          height: STAGE.h,
          transform: `translateX(clamp(0px, 12.5vw, 250px)) translate(-50%, -50%) scale(${scale})`,
        }}
      >
        <svg
          viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          {PANELS.map((p) => (
            <path
              key={p.id}
              data-branch
              d={branch(p)}
              fill="none"
              stroke={ACCENT}
              strokeOpacity="0.34"
              strokeWidth="1.15"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset="1"
              className={p.wide ? "max-xl:hidden" : undefined}
            />
          ))}
          {PANELS.flatMap((p, i) =>
            // Two rays per route: a soft blurred body and a crisp core.
            [0, 1].map((pass) => (
              <path
                key={`${p.id}-flow-${pass}`}
                data-flow
                d={branch(p)}
                fill="none"
                stroke="#9bffc0"
                strokeWidth={pass === 0 ? 5 : 1.7}
                strokeOpacity={pass === 0 ? 0.34 : 0.9}
                strokeLinecap="round"
                pathLength={1}
                opacity="0"
                className={cn(
                  "hero-os-flow",
                  pass === 0 && "hero-os-flow--glow",
                  p.wide && "max-xl:hidden",
                )}
                style={{ animationDelay: `${i * -0.42 - pass * 0.12}s` }}
              />
            )),
          )}
        </svg>

        <div
          className="absolute z-[2] -translate-x-1/2 -translate-y-1/2"
          style={{ left: CORE.x, top: CORE.y }}
        >
          <span
            data-halo
            className="pointer-events-none absolute top-1/2 left-1/2 size-[150px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
            style={{ border: `1px solid ${ACCENT}` }}
          />
          <div
            data-core
            className="grid place-items-center rounded-[34px] border backdrop-blur-[3px]"
            style={{
              width: CORE.size,
              height: CORE.size,
              borderColor: "rgba(255,255,255,.14)",
              background:
                "linear-gradient(180deg, rgba(30,42,34,.72), rgba(12,16,18,.62))",
            }}
          >
            <Sparkles data-core-icon size={46} strokeWidth={1.3} />
          </div>
        </div>

        {PANELS.map((p) => (
          <div
            key={p.id}
            data-panel
            data-dx={Math.round(CORE.x - (p.x + p.w / 2))}
            data-dy={Math.round(CORE.y - (p.y + p.h / 2))}
            data-beat={p.beat}
            className={cn(
              "pointer-events-none absolute rounded-[12px] border px-3 py-2.5 opacity-0 backdrop-blur-[3px] will-change-transform",
              p.front ? "z-[3]" : "z-[1]",
              p.wide && "max-xl:hidden",
            )}
            style={{
              left: p.x,
              top: p.y,
              width: p.w,
              height: p.h,
              borderColor: OFF_LINE,
              background:
                "linear-gradient(180deg, rgba(22,28,32,.62), rgba(11,14,16,.5))",
              boxShadow: "0 12px 30px rgba(0,0,0,.4)",
            }}
          >
            {(() => {
              const Icon = PANEL_ICONS[p.icon];
              return (
                <div className="flex h-full flex-col gap-[7px]">
                  <div className="flex shrink-0 items-center gap-[6px]">
                    <Icon
                      data-head
                      size={12}
                      strokeWidth={1.7}
                      style={{ color: "rgba(255,255,255,.55)" }}
                    />
                    <span
                      data-head
                      className="font-mono text-[10px] leading-none font-bold tracking-[0.12em] whitespace-nowrap uppercase"
                      style={{ color: "rgba(255,255,255,.62)" }}
                    >
                      {p.label}
                    </span>
                  </div>
                  <div className="min-h-0 flex-1">
                    <Body kind={p.kind} />
                  </div>
                </div>
              );
            })()}
          </div>
        ))}
      </div>
    </div>
  );
}
