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
import type { AuditPhase, AuditResponse, AuditResult } from "@/lib/audit/types";

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
  label: string;
  tone: "bad" | "ok";
  visible: boolean;
}

export const BASE_LINES = 8;
export const MAX_LINES = 9;

const FINDING_READ_TIME = 2;
export const DOT_TRAVEL_TIME = 2.1;

interface HeroContextValue {
  motionRef: React.RefObject<HeroMotion>;
  phase: AuditPhase;
  status: string;
  problems: string[];
  fixes: string[];
  activeFinding: AuditFinding | null;
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
  const [activeFinding, setActiveFinding] = useState<AuditFinding | null>(null);
  const [result, setResult] = useState<AuditResult | null>(null);

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
    setActiveFinding(null);
    setResult(null);
    setProblems([...hero.idleProblems]);
    setFixes([...hero.idleFixes]);
  }, [killTimeline]);

  const runAudit = useCallback(
    async (description: string) => {
      killTimeline();
      setPhase("loading");
      setResult(null);
      setActiveFinding(null);
      setProblems([]);
      setFixes([]);
      setStatus("reading how you work…");

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
        let sequenceAt = 0;

        setProblems(data.problems);
        setFixes(data.fixes);

        // Hold the flaw, route its dot into the ordered band, then hold the fix.
        for (let index = 0; index < total; index += 1) {
          tl.call(
            () => {
              setPhase("problems");
              setStatus(`flaw ${index + 1} of ${total}`);
              setActiveFinding({
                id: index * 3,
                index,
                total,
                label: data.problems[index],
                tone: "bad",
                visible: true,
              });
            },
            undefined,
            sequenceAt,
          );
          sequenceAt += FINDING_READ_TIME;

          tl.call(
            () => {
              setPhase("fixes");
              setStatus(`mapping solution ${index + 1} of ${total}…`);
              setActiveFinding({
                id: index * 3 + 1,
                index,
                total,
                label: data.fixes[index],
                tone: "ok",
                visible: false,
              });

              if (index === 0) {
                gsap.to(m, {
                  chaos: 0,
                  duration: 1.5,
                  ease: "power2.inOut",
                });
                gsap.to(m, {
                  resolve: 1,
                  duration: 2.15,
                  ease: "power3.inOut",
                });
              }
            },
            undefined,
            sequenceAt,
          );
          sequenceAt += DOT_TRAVEL_TIME;

          tl.call(
            () => {
              setStatus(`solution ${index + 1} of ${total}`);
              setActiveFinding({
                id: index * 3 + 2,
                index,
                total,
                label: data.fixes[index],
                tone: "ok",
                visible: true,
              });
            },
            undefined,
            sequenceAt,
          );
          sequenceAt += FINDING_READ_TIME;
        }

        tl.call(
          () => {
            setActiveFinding(null);
            setPhase("done");
            setStatus(
              `${data.problems.length} found · this is the short version`,
            );
            setResult(data);
          },
          undefined,
          sequenceAt,
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
      activeFinding,
      result,
      runAudit,
      reset,
    }),
    [phase, status, problems, fixes, activeFinding, result, runAudit, reset],
  );

  return <HeroContext.Provider value={value}>{children}</HeroContext.Provider>;
}
