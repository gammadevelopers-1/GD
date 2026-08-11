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
import type { AuditPhase, AuditResponse } from "@/lib/audit/types";

// Keep the fast moving canvas values outside React
export interface HeroMotion {
  chaos: number;
  resolve: number;
  activeLines: number;
}

export interface AuditFinding {
  id: number;
  index: number;
  total: number;
  problem: string;
  fix: string;
  messyHalfTime: number;
  messyFinishTime: number;
  centerCrossTime: number;
  rightTravelTime: number;
}

export const BASE_LINES = 8;
export const MAX_LINES = 9;

// Fallback duration for reduced motion and defensive timing calculations.
export const SIGNAL_TRAVEL_TIME = 8;

interface HeroContextValue {
  motionRef: React.RefObject<HeroMotion>;
  phase: AuditPhase;
  status: string;
  problems: string[];
  fixes: string[];
  activeFindings: AuditFinding[];
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
  const [activeFindings, setActiveFindings] = useState<AuditFinding[]>([]);

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
    setActiveFindings([]);
    setProblems([...hero.idleProblems]);
    setFixes([...hero.idleFixes]);
  }, [killTimeline]);

  const runAudit = useCallback(
    async (description: string) => {
      killTimeline();
      setPhase("loading");
      setActiveFindings([]);
      setProblems([]);
      setFixes([]);
      setStatus("Understanding your business…");

      const m = motionRef.current;
      m.resolve = 0;

      gsap.fromTo(
        m,
        { chaos: 0 },
        { chaos: 1, duration: 0.45, ease: "power3.out" },
      );
      gsap.to(m, { chaos: 0.22, duration: 5, ease: "power2.out", delay: 0.45 });

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
          setStatus(json.error.replace(/\s*[—–]\s*/g, ", "));
          setProblems([...hero.idleProblems]);
          setFixes([...hero.idleFixes]);
          return;
        }

        const data = json.data;
        const tl = gsap.timeline();
        timeline.current = tl;
        const total = Math.min(data.problems.length, data.fixes.length);
        let nextEntryAt = 0;
        let lastSignalAt = 0;
        let firstSolutionAt = Number.POSITIVE_INFINITY;

        setProblems(data.problems);
        setFixes(data.fixes);

        // GSAP staggers independent, uninterrupted signal journeys. The canvas
        // reads each tweened journey and swaps the flaw card for its solution
        // only while the point is hidden behind the central message.
        for (let index = 0; index < total; index += 1) {
          const entryAt = nextEntryAt;
          const messyHalfTime = gsap.utils.random(2.05, 2.45, 0.05);
          const messyFinishTime = gsap.utils.random(0.72, 0.94, 0.02);
          const centerCrossTime = gsap.utils.random(0.78, 1.02, 0.02);
          const rightTravelTime = gsap.utils.random(3.25, 3.85, 0.05);
          const travelTime =
            messyHalfTime + messyFinishTime + centerCrossTime + rightTravelTime;
          lastSignalAt = Math.max(lastSignalAt, entryAt + travelTime);
          firstSolutionAt = Math.min(
            firstSolutionAt,
            entryAt + messyHalfTime + messyFinishTime + centerCrossTime,
          );
          tl.call(
            () => {
              if (index === 0) setPhase("problems");
              setActiveFindings((current) => [
                ...current,
                {
                  id: index,
                  index,
                  total,
                  problem: data.problems[index],
                  fix: data.fixes[index],
                  messyHalfTime,
                  messyFinishTime,
                  centerCrossTime,
                  rightTravelTime,
                },
              ]);
            },
            undefined,
            entryAt,
          );

          // The next finding enters exactly as this one reaches the midpoint
          // of the visible messy section. Small timing variation keeps the
          // conveyor organic without collapsing every flaw onto the left.
          nextEntryAt += messyHalfTime;
        }

        const resolveAt = SIGNAL_TRAVEL_TIME * 0.29;
        tl.call(
          () => {
            gsap.to(m, {
              chaos: 0,
              duration: 2.8,
              ease: "power2.inOut",
            });
            gsap.to(m, {
              resolve: 1,
              duration: 3.6,
              ease: "power2.inOut",
            });
          },
          undefined,
          resolveAt,
        );

        tl.call(
          () => {
            setPhase("fixes");
          },
          undefined,
          Number.isFinite(firstSolutionAt)
            ? firstSolutionAt
            : SIGNAL_TRAVEL_TIME * 0.74,
        );

        tl.call(
          () => {
            setActiveFindings([]);
            setPhase("done");
            setStatus("");
          },
          undefined,
          lastSignalAt + 0.2,
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
        setStatus("Could not reach the model just now. Try again.");
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
      activeFindings,
      runAudit,
      reset,
    }),
    [phase, status, problems, fixes, activeFindings, runAudit, reset],
  );

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
}
