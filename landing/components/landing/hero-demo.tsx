"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  heroDemoExercises,
  heroDemoWeeks,
  type DecisionKind,
} from "@/data/landing-content";

const INTERVAL_MS = 2800;
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  );
}

const decisionStyles: Record<DecisionKind, string> = {
  start: "border-white/12 bg-white/[0.05] text-white/65",
  advance: "border-[#125bff]/45 bg-[#125bff]/14 text-[#9fbeff]",
  hold: "border-white/12 bg-white/[0.05] text-white/65",
  regress: "border-[#f5a97f]/40 bg-[#f5a97f]/12 text-[#f5b894]",
};

const decisionGlyphs: Record<DecisionKind, string> = {
  start: "•",
  advance: "▲",
  hold: "▶",
  regress: "▼",
};

/**
 * Scripted decision-log demo for the hero. Cycles through eight weeks of
 * engine output while on screen; renders week 1 on the server, and a static
 * final week for reduced-motion users. Changing values remount keyed spans
 * so the cheap `value-swap` keyframe retriggers.
 */
export function HeroDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    const element = rootRef.current;
    if (!element || prefersReducedMotion) return;
    let onScreen = false;
    const sync = () => setRunning(onScreen && !document.hidden);
    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting;
        sync();
      },
      { threshold: 0.25 },
    );
    observer.observe(element);
    document.addEventListener("visibilitychange", sync);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (!running || prefersReducedMotion) return;
    const id = window.setInterval(
      () => setIndex((value) => (value + 1) % heroDemoWeeks.length),
      INTERVAL_MS,
    );
    return () => window.clearInterval(id);
  }, [running, prefersReducedMotion]);

  // Reduced-motion users get the final week as a static panel.
  const current = prefersReducedMotion
    ? heroDemoWeeks[heroDemoWeeks.length - 1]
    : heroDemoWeeks[index];

  return (
    <div
      ref={rootRef}
      aria-live="off"
      className="relative rounded-[2.2rem] border border-white/12 bg-[linear-gradient(180deg,_rgba(10,13,19,0.98),_rgba(6,9,13,0.92))] p-4 shadow-[0_32px_120px_rgba(5,7,11,0.72)] sm:p-5"
    >
      <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.04] p-5 sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.22em] text-white/48 uppercase">
              Progression engine
            </p>
            <p className="mt-1 text-base font-semibold text-white">
              Live decision log
            </p>
          </div>
          <div className="rounded-full border border-[#125bff]/40 bg-[#125bff]/14 px-4 py-2 font-display text-sm font-semibold text-[#9fbeff]">
            Week{" "}
            <span key={current.week} className="value-swap">
              {String(current.week).padStart(2, "0")}
            </span>
            <span className="text-[#9fbeff]/55"> / 08</span>
          </div>
        </div>

        <div className="space-y-3">
          {heroDemoExercises.map((name, rowIndex) => {
            const row = current.rows[rowIndex];
            return (
              <div
                key={name}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#0b111a] px-4 py-3.5"
              >
                <p className="text-sm font-semibold text-white">{name}</p>
                <div className="flex items-center gap-3">
                  <span
                    key={`${name}-${row.target}`}
                    className="value-swap min-w-[3.6rem] text-right font-display text-sm font-semibold text-white/90 tabular-nums"
                  >
                    {row.target}
                  </span>
                  <span
                    key={`${name}-${current.week}-decision`}
                    className={`value-swap inline-flex min-w-[7.4rem] items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap ${decisionStyles[row.decision.kind]}`}
                  >
                    <span aria-hidden="true">
                      {decisionGlyphs[row.decision.kind]}
                    </span>
                    {row.decision.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 min-h-12 text-sm leading-6 text-white/60">
          <span key={`note-${current.week}`} className="value-swap">
            {current.note}
          </span>
        </p>

        <div className="mt-4">
          <div className="relative h-1 overflow-hidden rounded-full bg-white/10">
            <div
              className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[linear-gradient(90deg,_#125bff,_#7db1ff)] transition-transform duration-500 ease-out"
              style={{
                transform: `scaleX(${(index + 1) / heroDemoWeeks.length})`,
              }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[0.68rem] tracking-[0.18em] text-white/40 uppercase">
            <span>8-week block</span>
            <span>Scripted demo · real engine logic</span>
          </div>
        </div>
      </div>
    </div>
  );
}
