"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { gsap } from "@/lib/gsap";
import { hero } from "@/lib/content/home";
import type { AuditPhase, AuditResponse, AuditResult } from "@/types/audit";

/**
 * Per-frame values live in a plain object, not in state. The canvas reads them
 * inside requestAnimationFrame and GSAP tweens them directly, so neither one
 * ever triggers a React render.
 */
export interface HeroMotion {
  chaos: number;
  resolve: number;
  activeLines: number;
}

export const BASE_LINES = 13;
export const MAX_LINES = 23;

interface HeroContextValue {
  motionRef: React.RefObject<HeroMotion>;
  phase: AuditPhase;
  status: string;
  problems: string[];
  fixes: string[];
  result: AuditResult | null;
  runAudit: (description: string) => Promise<void>;
  reset: () => void;
}

const HeroContext = createContext<HeroContextValue | null>(null);

export function useHero() {
  const ctx = useContext(HeroContext);
  if (!ctx) throw new Error("useHero must be used inside <HeroProvider>");
  return ctx;
}

export function HeroProvider({ children }: { children: ReactNode }) {
  const motionRef = useRef<HeroMotion>({
    chaos: 0,
    resolve: 0,
    activeLines: BASE_LINES,
  });

  const [phase, setPhase] = useState<AuditPhase>("idle");
  const [status, setStatus] = useState("");
  const [problems, setProblems] = useState<string[]>([...hero.idleProblems]);
  const [fixes, setFixes] = useState<string[]>([...hero.idleFixes]);
  const [result, setResult] = useState<AuditResult | null>(null);

  /** One timeline owns the whole audit sequence, so reset is a single .kill(). */
  const timeline = useRef<gsap.core.Timeline | null>(null);

  const killTimeline = useCallback(() => {
    timeline.current?.kill();
    timeline.current = null;
    gsap.killTweensOf(motionRef.current);
  }, []);

  const reset = useCallback(() => {
    killTimeline();
    gsap.to(motionRef.current, {
      chaos: 0,
      resolve: 0,
      activeLines: BASE_LINES,
      duration: 0.9,
      ease: "power2.inOut",
      snap: { activeLines: 1 },
    });
    setPhase("idle");
    setStatus("");
    setResult(null);
    setProblems([...hero.idleProblems]);
    setFixes([...hero.idleFixes]);
  }, [killTimeline]);

  const runAudit = useCallback(
    async (description: string) => {
      killTimeline();
      setPhase("loading");
      setResult(null);
      setProblems([]);
      setFixes([]);
      setStatus("reading how you work…");

      const m = motionRef.current;
      m.resolve = 0;

      // Spike, then a long eased settle. Linear intervals looked mechanical.
      gsap.fromTo(
        m,
        { chaos: 0 },
        { chaos: 1, duration: 0.45, ease: "power3.out" },
      );
      gsap.to(m, { chaos: 0.22, duration: 5, ease: "power2.out", delay: 0.45 });

      // The mess grows while it thinks — same band height, more lines packed in.
      gsap.to(m, {
        activeLines: MAX_LINES,
        duration: 1.9,
        ease: "power1.inOut",
        snap: { activeLines: 1 },
      });

      try {
        const res = await fetch("/api/audit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ description }),
        });
        const json = (await res.json()) as AuditResponse;

        if (!json.ok) {
          gsap.to(m, {
            chaos: 0,
            activeLines: BASE_LINES,
            duration: 0.9,
            ease: "power2.inOut",
            snap: { activeLines: 1 },
          });
          setPhase("error");
          setStatus(json.error);
          setProblems([...hero.idleProblems]);
          setFixes([...hero.idleFixes]);
          return;
        }

        const data = json.data;
        const tl = gsap.timeline();
        timeline.current = tl;

        // 1 — the faults land on the messy side
        tl.call(() => {
          setPhase("problems");
          setStatus("here's what we'd expect to find");
          setProblems(data.problems);
        });

        // 2 — the field resolves and the fixes land on the straight side
        tl.call(
          () => {
            setPhase("fixes");
            setStatus("and the same business, fixed");
            setFixes(data.fixes);
            gsap.to(m, { chaos: 0, duration: 1.2, ease: "power2.inOut" });
            gsap.to(m, { resolve: 1, duration: 1.6, ease: "power2.inOut" });
          },
          undefined,
          1.7,
        );

        // 3 — hand over to the booking CTA
        tl.call(
          () => {
            setPhase("done");
            setStatus(
              `${data.problems.length} found · this is the short version`,
            );
            setResult(data);
          },
          undefined,
          3.4,
        );
      } catch {
        gsap.to(m, {
          chaos: 0,
          activeLines: BASE_LINES,
          duration: 0.9,
          ease: "power2.inOut",
          snap: { activeLines: 1 },
        });
        setPhase("error");
        setStatus("Could not reach the model just now — try again.");
        setProblems([...hero.idleProblems]);
        setFixes([...hero.idleFixes]);
      }
    },
    [killTimeline],
  );

  const value = useMemo(
    () => ({
      motionRef,
      phase,
      status,
      problems,
      fixes,
      result,
      runAudit,
      reset,
    }),
    [phase, status, problems, fixes, result, runAudit, reset],
  );

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
}
