import {
  heroDemoExercises,
  heroDemoWeeks,
  proLedger,
} from "@/data/landing-content";
import { decisionGlyphs, decisionStyles } from "./decision";

const CURRENT_WEEK = 4;
const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
// Static fill = CURRENT_WEEK / weekCount; GSAP animates from empty to this.
const RING_OFFSET =
  RING_CIRCUMFERENCE * (1 - CURRENT_WEEK / proLedger.weekCount);

const week = heroDemoWeeks[CURRENT_WEEK - 1];
const pushups = proLedger.rows[0];
const sidePlank = proLedger.rows[1];

/* The Kinova app, rendered inside a phone bezel. Shows a real "Week 4 of 8"
   frame from the product data; the cinematic hero animates the ring/counter/
   widgets via GSAP, but this static frame is what no-JS / reduced-motion /
   mobile see. */
export function PhoneMockup() {
  return (
    <div className="cine-phone relative mx-auto w-[260px] max-w-full">
      {/* floating glass badges */}
      <div className="cine-float cine-badge absolute -left-10 top-10 z-30 hidden rounded-2xl px-4 py-3 sm:block">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-[#9fbeff]">
          <span aria-hidden="true">▲</span> Advance
        </p>
        <p className="mt-0.5 text-xs text-white/55 tabular-nums">
          Push-ups {pushups.values[0]} → {pushups.values[pushups.values.length - 1]}
        </p>
      </div>
      <div className="cine-float cine-badge absolute -right-8 bottom-16 z-30 hidden rounded-2xl px-4 py-3 sm:block">
        <p className="text-sm font-semibold text-white">8-week block</p>
        <p className="mt-0.5 text-xs text-white/55">
          +15s plank · {sidePlank.values[0]} → {sidePlank.values[sidePlank.values.length - 1]}
        </p>
      </div>

      {/* bezel + screen */}
      <div className="cine-bezel relative rounded-[2.6rem] p-2.5">
        <div className="cine-screen relative overflow-hidden rounded-[2.1rem] px-5 pb-6 pt-9">
          {/* dynamic island */}
          <div className="absolute left-1/2 top-2.5 z-20 h-6 w-[88px] -translate-x-1/2 rounded-full bg-[rgba(5,7,11,0.92)]" />

          {/* status bar */}
          <div className="flex items-center justify-between text-[0.6rem] font-semibold tracking-[0.18em] text-white/45 uppercase">
            <span className="tabular-nums">9:41</span>
            <span>Kinova</span>
          </div>

          {/* header */}
          <div className="mt-5">
            <p className="text-[0.6rem] tracking-[0.22em] text-white/45 uppercase">
              Today · This week
            </p>
            <p className="mt-1 font-display text-lg font-semibold text-white">
              Your week
            </p>
          </div>

          {/* week ring */}
          <div className="relative mx-auto mt-5 h-28 w-28">
            <svg viewBox="0 0 100 100" className="cine-ring h-full w-full">
              <circle
                cx="50"
                cy="50"
                r={RING_RADIUS}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="7"
              />
              <circle
                className="cine-ring-progress"
                cx="50"
                cy="50"
                r={RING_RADIUS}
                fill="none"
                stroke="#125bff"
                strokeWidth="7"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_OFFSET}
                style={{ filter: "drop-shadow(0 0 6px rgba(18,91,255,0.5))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-3xl font-semibold text-white tabular-nums">
                <span className="cine-counter">{CURRENT_WEEK}</span>
              </span>
              <span className="text-[0.6rem] tracking-[0.16em] text-[#9fbeff]/70 uppercase">
                of {proLedger.weekCount} weeks
              </span>
            </div>
          </div>

          {/* exercise rows */}
          <div className="mt-5 space-y-2.5">
            {heroDemoExercises.map((name, index) => {
              const row = week.rows[index];
              return (
                <div
                  key={name}
                  className="cine-widget flex items-center justify-between gap-2 rounded-xl border border-white/8 bg-[#0b111a] px-3 py-2.5"
                >
                  <span className="text-xs font-semibold text-white">{name}</span>
                  <span className="flex items-center gap-2">
                    <span className="font-display text-xs text-white/80 tabular-nums">
                      {row.target}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.6rem] font-semibold whitespace-nowrap ${decisionStyles[row.decision.kind]}`}
                    >
                      <span aria-hidden="true">
                        {decisionGlyphs[row.decision.kind]}
                      </span>
                      {row.decision.label}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* footer progress */}
          <div className="cine-widget mt-5">
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,_#125bff,_#7db1ff)]"
                style={{ width: `${(CURRENT_WEEK / proLedger.weekCount) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-[0.6rem] tracking-[0.14em] text-white/40 uppercase">
              8-week block · advance · hold · regress
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
