"use client";

import { Check } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { method } from "@/lib/content/home";
import { duration, ease, gsap, useGSAP } from "@/lib/gsap";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

const flow = method.console;

const SLOTS = [
  "lg:left-[2%] lg:top-[150px]",
  "lg:left-[37%] lg:top-[44px]",
  "lg:left-[37%] lg:top-[150px]",
  "lg:left-[37%] lg:top-[256px]",
  "lg:left-[71%] lg:top-[44px]",
  "lg:left-[71%] lg:top-[150px]",
  "lg:left-[71%] lg:top-[256px]",
];

const TOTAL = flow.tasks.length;

type EventKind = "log" | "card" | "done" | "reset";

interface FlowEvent {
  kind: EventKind;
  task: number;
  delay: number;
}

const EVENTS: FlowEvent[] = flow.tasks.flatMap((_, n) => [
  { kind: "log" as const, task: n, delay: n === 0 ? 0 : 480 },
  { kind: "card" as const, task: n, delay: 300 },
  { kind: "done" as const, task: n, delay: 320 },
]);
EVENTS.push({ kind: "reset", task: -1, delay: 2800 });

interface Connector {
  d: string;
  head: string;
  length: number;
}

export function FlowConsole() {
  const reduced = useReducedMotion();
  const plane = useRef<HTMLDivElement>(null);
  const screen = useRef<HTMLDivElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const [cursor, setCursor] = useState(0);
  const [cycle, setCycle] = useState(0);

  const played = EVENTS.slice(0, cursor);
  const visible = reduced
    ? TOTAL
    : played.filter((e) => e.kind === "card").length;
  const filled = reduced
    ? TOTAL
    : played.filter((e) => e.kind === "done").length;
  const logs = reduced
    ? flow.tasks.map((task, i) => ({
        key: `static-${i}`,
        text: `${task.log}  ${task.done}`,
        done: true,
      }))
    : played
        .filter((e) => e.kind === "log" || e.kind === "done")
        .map((e) => ({
          key: `${cycle}-${e.kind}-${e.task}`,
          text:
            e.kind === "log" ? flow.tasks[e.task].log : flow.tasks[e.task].done,
          done: e.kind === "done",
        }));

  useGSAP(
    () => {
      if (reduced || !screen.current) return;

      gsap.fromTo(
        screen.current,
        { rotateX: 24, y: 80, scale: 0.82, opacity: 0.2 },
        {
          rotateX: 0,
          y: 0,
          scale: 1,
          opacity: 1,
          duration: duration.slow,
          ease: ease.out,
          scrollTrigger: {
            trigger: screen.current,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: plane, dependencies: [reduced] },
  );

  const measure = useCallback(() => {
    const host = area.current;
    if (!host) return;

    setBox({ width: host.offsetWidth, height: host.offsetHeight });

    const next: Connector[] = [];
    for (let i = 1; i < TOTAL; i += 1) {
      const target = cards.current[i];
      const source = cards.current[i <= 3 ? 0 : i - 3];
      if (!target || !source) continue;

      const sx = source.offsetLeft + source.offsetWidth;
      const sy = source.offsetTop + source.offsetHeight / 2;
      const tx = target.offsetLeft;
      const ty = target.offsetTop + target.offsetHeight / 2;
      const endX = tx - 11;

      let d: string;
      if (Math.abs(ty - sy) < 2) {
        d = `M ${sx} ${sy} L ${endX} ${ty}`;
      } else {
        const jx = sx + (endX - sx) * 0.5;
        const r = 14;
        const dir = ty > sy ? 1 : -1;
        d =
          `M ${sx} ${sy} H ${jx - r} Q ${jx} ${sy} ${jx} ${sy + dir * r}` +
          ` V ${ty - dir * r} Q ${jx} ${ty} ${jx + r} ${ty} H ${endX}`;
      }

      next.push({
        d,
        head: `M ${tx - 11} ${ty - 5} L ${tx - 3} ${ty} L ${tx - 11} ${ty + 5}`,
        length: Math.hypot(tx - sx, ty - sy) + Math.abs(ty - sy) + 60,
      });
    }
    setConnectors(next);
  }, []);

  useLayoutEffect(() => {
    measure();
    const observer = new ResizeObserver(measure);
    if (area.current) observer.observe(area.current);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    if (reduced) return;

    const event = EVENTS[cursor];
    if (!event) return;

    let timer = 0;
    timer = window.setTimeout(() => {
      if (event.kind === "reset") {
        setCycle((c) => c + 1);
        setCursor(0);
      } else {
        setCursor((c) => c + 1);
      }
    }, event.delay);
    return () => window.clearTimeout(timer);
  }, [cursor, reduced]);

  function stageWidth(stage: string) {
    let width = 0;
    for (let i = 0; i < filled; i += 1) {
      const task = flow.tasks[i];
      if (task.stage === stage) width = Math.max(width, task.fill);
    }
    return `${width * 100}%`;
  }

  return (
    <div ref={plane} className="[perspective:1500px]">
      <div
        ref={screen}
        className="relative [transform-origin:50%_90%] overflow-hidden rounded-[24px] border border-black/10 text-[#eceae2] shadow-[0_50px_100px_-54px_rgba(0,0,0,0.72)] [background:radial-gradient(ellipse_55%_60%_at_82%_16%,rgba(47,232,92,0.10),transparent_64%),linear-gradient(180deg,#0e1318,#0a0d11)]"
      >
        <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-5 py-3.5">
          <span className="flex gap-1.5">
            <span className="size-2.75 rounded-full bg-[#ff5f57]" />
            <span className="size-2.75 rounded-full bg-[#febc2e]" />
            <span className="size-2.75 rounded-full bg-[#28c840]" />
          </span>
          <span className="ml-2 truncate font-mono text-[11.5px] text-[#7f857c]">
            {flow.title}
          </span>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.75 font-mono text-[10.5px] tracking-[0.14em] text-[#75efa0] uppercase">
            <span className="bg-brand size-1.5 animate-pulse rounded-full shadow-[0_0_9px_rgba(47,232,92,0.7)]" />
            live
          </span>
        </div>

        <div className="grid lg:grid-cols-[0.82fr_1.72fr]">
          <div className="border-white/[0.06] px-6.5 py-6 font-mono text-[13px] leading-[1.9] text-[#cdd3ca] max-lg:border-b lg:min-h-[440px] lg:border-r">
            {logs.map((line) => (
              <div
                key={line.key}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-1 duration-300",
                  line.done ? "text-[#8fe7ab]" : "text-[#cdd3ca]",
                )}
              >
                {line.done ? `  ${line.text}` : line.text}
              </div>
            ))}
          </div>

          <div className="relative px-6.5 py-5.5">
            <div className="flex justify-between gap-2.5">
              {flow.stages.map((stage, i) => (
                <div
                  key={stage.key}
                  className={cn(
                    "w-[27%]",
                    i === flow.stages.length - 1 && "text-right",
                  )}
                >
                  <div className="mb-1.75 font-mono text-[10px] tracking-[0.16em] text-[#8a908a] uppercase">
                    {stage.label}
                  </div>
                  <div className="h-0.75 overflow-hidden rounded-sm bg-white/[0.08]">
                    <span
                      className="block h-full rounded-sm transition-[width] duration-500 ease-out [background:linear-gradient(90deg,#059669,#2fe85c)]"
                      style={{ width: stageWidth(stage.key) }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              ref={area}
              className="relative mt-6 flex flex-col gap-2.5 lg:block lg:h-[340px]"
            >
              <svg
                key={cycle}
                aria-hidden
                preserveAspectRatio="none"
                viewBox={`0 0 ${box.width} ${box.height}`}
                className="pointer-events-none absolute inset-0 z-1 size-full overflow-visible opacity-0 lg:opacity-100"
              >
                {connectors.map((conn, i) => (
                  <g key={i}>
                    <path
                      d={conn.d}
                      fill="none"
                      stroke="#8ff0b3"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="[filter:drop-shadow(0_0_5px_rgba(47,232,92,0.4))] motion-reduce:transition-none"
                      style={{
                        strokeDasharray: conn.length,
                        strokeDashoffset: visible > i + 1 ? 0 : conn.length,
                        transition:
                          "stroke-dashoffset .85s cubic-bezier(.22,1,.36,1)",
                      }}
                    />
                    <path
                      d={conn.head}
                      fill="none"
                      stroke="#a9f6c6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={cn(
                        "transition-opacity delay-500 duration-400",
                        visible > i + 1 ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </g>
                ))}
              </svg>

              <div className="relative z-2 contents lg:absolute lg:inset-0 lg:block">
                {flow.tasks.map((task, i) => (
                  <div
                    key={task.card.title}
                    ref={(node) => {
                      cards.current[i] = node;
                    }}
                    className={cn(
                      "hover:border-brand flex items-center gap-2.5 rounded-[13px] border border-[rgba(47,232,92,0.4)] bg-[#12171d] px-3.25 py-3 text-left shadow-[0_16px_34px_-20px_rgba(47,232,92,0.45)] transition-[opacity,translate,scale,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:scale-[1.03] hover:shadow-[0_26px_50px_-20px_rgba(47,232,92,0.6)] lg:absolute lg:w-[28%]",
                      SLOTS[i],
                      visible > i
                        ? "translate-y-0 scale-100 opacity-100"
                        : "translate-y-3 scale-92 opacity-0",
                    )}
                  >
                    <span className="bg-brand grid size-7 shrink-0 place-items-center rounded-[9px] text-[#101512]">
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                    <span className="min-w-0 flex-1 leading-tight">
                      <span className="block text-[13px] leading-tight font-semibold text-[#eceae2]">
                        {task.card.title}
                      </span>
                      <span className="mt-0.5 block font-mono text-[9.5px] text-[#8a908a]">
                        {task.card.meta}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
