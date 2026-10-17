"use client";

import { useRef } from "react";

import { system } from "@/lib/gamma-content";
import { gsap, useGSAP } from "@/lib/gsap";

const VW = 1000;
const VH = 620;
const CX = 500;
const CY = 285;

/** Branch from the core to a node — bowed out so it reads as growth, not a spoke. */
function branch(x: number, y: number) {
  const mx = (CX + x) / 2;
  const my = (CY + y) / 2;
  const bow = (y - CY) * 0.22;
  return `M ${CX} ${CY} C ${mx + bow} ${CY}, ${mx} ${my}, ${x} ${y}`;
}

export function SystemSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          const paths = gsap.utils.toArray<SVGPathElement>("[data-branch]");
          const cards = gsap.utils.toArray<HTMLElement>("[data-card]");

          paths.forEach((path) => {
            const len = path.getTotalLength();
            gsap.set(path, { strokeDasharray: len, strokeDashoffset: len });
          });

          cards.forEach((card) => {
            gsap.set(card, {
              x: Number(card.dataset.fx),
              y: Number(card.dataset.fy),
              rotate: Number(card.dataset.fr),
            });
          });

          gsap.set("[data-core]", { opacity: 0, scale: 0.72 });
          gsap.set("[data-after]", { opacity: 0, y: 6 });
          gsap.set("[data-web]", { opacity: 0 });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: "+=2800",
              pin: true,
              scrub: 0.7,
            },
          });

          // Beat 2 — the layer comes up.
          tl.to("[data-core]", {
            opacity: 1,
            scale: 1,
            duration: 1.1,
            ease: "power3.out",
          });

          // Beat 3 — branches grow one at a time, each card resolving as it lands.
          paths.forEach((path, i) => {
            const start = 1.2 + i * 0.85;
            tl.to(
              path,
              { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" },
              start,
            )
              .to(
                cards[i],
                { x: 0, y: 0, rotate: 0, duration: 1.1, ease: "power3.out" },
                start,
              )
              .to(cards[i], { "--on": 1, duration: 0.5 }, start + 0.75)
              .to(
                `[data-before="${i}"]`,
                { opacity: 0, y: -6, duration: 0.35 },
                start + 0.8,
              )
              .to(
                `[data-after="${i}"]`,
                { opacity: 1, y: 0, duration: 0.4 },
                start + 0.95,
              );
          });

          // Beat 4 — it closes into one system.
          const end = 1.2 + paths.length * 0.85 + 0.6;
          tl.to("[data-web]", { opacity: 1, duration: 0.8 }, end).to(
            "[data-closing]",
            { opacity: 1, y: 0, duration: 0.7 },
            end + 0.2,
          );
        },
      );

      // Reduced motion and mobile both get the resolved state, no pin.
      mm.add("(max-width: 767px), (prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-card]", { x: 0, y: 0, rotate: 0, "--on": 1 });
        gsap.set("[data-core], [data-web], [data-closing]", {
          opacity: 1,
          scale: 1,
          y: 0,
        });
        gsap.set("[data-before]", { opacity: 0 });
        gsap.set("[data-after]", { opacity: 1, y: 0 });
        gsap.utils.toArray<SVGPathElement>("[data-branch]").forEach((p) => {
          gsap.set(p, { strokeDasharray: "none", strokeDashoffset: 0 });
        });
      });

      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      id="system"
      className="bg-dark relative flex min-h-svh flex-col overflow-hidden py-[clamp(36px,4.5vw,64px)]"
    >
      <div className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-6">
        <div className="max-w-[720px] shrink-0">
          <h2 className="t-h2">
            <span className="text-dark-head block">{system.heading.one}</span>
            <span className="text-brand block">{system.heading.two}</span>
          </h2>
          <p className="t-lead text-dark-body mt-5 max-w-[56ch]">
            {system.lead}
          </p>
        </div>

        <div className="relative mx-auto mt-[clamp(32px,5vw,64px)] hidden w-full max-w-[1000px] md:block">
          <div
            className="relative w-full"
            style={{ aspectRatio: `${VW} / ${VH}` }}
          >
            <svg
              viewBox={`0 0 ${VW} ${VH}`}
              className="absolute inset-0 h-full w-full"
              aria-hidden
            >
              <circle
                data-web
                cx={CX}
                cy={CY}
                r={196}
                fill="none"
                stroke="var(--color-brand)"
                strokeOpacity="0.16"
                strokeWidth="1"
              />
              {system.nodes.map((n, i) => (
                <path
                  key={n.label}
                  data-branch
                  data-i={i}
                  d={branch(n.at.x, n.at.y)}
                  fill="none"
                  stroke="var(--color-brand)"
                  strokeOpacity="0.5"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ))}
            </svg>

            <div
              data-core
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${(CX / VW) * 100}%`,
                top: `${(CY / VH) * 100}%`,
              }}
            >
              <div className="relative grid size-[128px] place-items-center">
                <span className="bg-brand/20 absolute inset-0 rounded-full blur-2xl" />
                <span className="border-brand/40 absolute inset-0 animate-[spin_14s_linear_infinite] rounded-full border border-dashed" />
                <span className="border-brand/25 absolute inset-[14px] rounded-full border" />
                <span className="bg-dark-row border-brand/50 relative grid size-[84px] place-items-center rounded-full border text-center">
                  <span className="t-h4 text-brand leading-none">
                    {system.core.label}
                  </span>
                </span>
              </div>
            </div>

            {system.nodes.map((n, i) => (
              <div
                key={n.label}
                data-card
                data-fx={n.from.x}
                data-fy={n.from.y}
                data-fr={n.from.r}
                className="absolute w-[212px] -translate-x-1/2 -translate-y-1/2 rounded-[14px] border p-4 transition-none"
                style={{
                  left: `${(n.at.x / VW) * 100}%`,
                  top: `${(n.at.y / VH) * 100}%`,
                  borderColor:
                    "color-mix(in oklab, var(--color-brand) calc(var(--on, 0) * 45%), var(--color-dark-line-strong))",
                  background:
                    "color-mix(in oklab, var(--color-brand) calc(var(--on, 0) * 7%), var(--color-dark-row))",
                }}
              >
                <p className="t-eyebrow text-dark-head">{n.label}</p>
                <div className="relative mt-2 h-[38px]">
                  <p
                    data-before={i}
                    className="t-meta text-dim-dark absolute inset-0 leading-[1.45]"
                  >
                    {n.before}
                  </p>
                  <p
                    data-after={i}
                    className="t-meta text-dark-body absolute inset-0 leading-[1.45]"
                  >
                    {n.after}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p
          data-closing
          className="t-h3 text-dark-head mt-[clamp(12px,2vh,28px)] hidden shrink-0 translate-y-3 text-center opacity-0 md:block"
        >
          {system.closing}
        </p>

        {/* Small screens get the resolved state as a plain list. */}
        <ul className="mt-10 grid shrink-0 gap-3 md:hidden">
          {system.nodes.map((n) => (
            <li
              key={n.label}
              className="border-dark-line-strong bg-dark-row rounded-[14px] border p-4"
            >
              <p className="t-eyebrow text-dark-head">{n.label}</p>
              <p className="t-meta text-dark-body mt-2">{n.after}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
