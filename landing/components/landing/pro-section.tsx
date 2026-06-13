import Link from "next/link";
import { Fragment, type CSSProperties } from "react";
import { proLedger } from "@/data/landing-content";
import { siteConfig } from "@/data/site-config";
import { ArrowIcon } from "./icons";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

type MarkKind = (typeof proLedger.marks)[number]["kind"];

const markChipStyles: Record<MarkKind, string> = {
  advance: "border-[#125bff]/45 bg-[#125bff]/14 text-[#9fbeff]",
  hold: "border-white/14 bg-white/[0.05] text-white/65",
  regress: "border-[#f5a97f]/40 bg-[#f5a97f]/12 text-[#f5b894]",
};

const markColumnTints: Record<MarkKind, string> = {
  advance: "bg-[#125bff]/[0.09]",
  hold: "bg-white/[0.04]",
  regress: "bg-[#f5a97f]/[0.06]",
};

const markGlyphs: Record<MarkKind, string> = {
  advance: "▲",
  hold: "▶",
  regress: "▼",
};

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function ProSection() {
  const weekNumbers = Array.from(
    { length: proLedger.weekCount },
    (_, index) => index + 1,
  );
  const marksByWeek = new Map<number, (typeof proLedger.marks)[number]>(
    proLedger.marks.map((mark) => [mark.week, mark]),
  );

  return (
    <section id="pro" className="relative text-white">
      <div className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-32">
        <SectionHeading
          inverse
          eyebrow="Kinova Pro · The progression engine"
          title="Targets that move. Eight weeks, one rough patch, no reset."
          description="Log each session. The engine decides — advance, hold, or regress — and writes next week's targets."
        />

        <Reveal stagger className="mt-12">
          <div className="rounded-[2rem] border border-white/12 bg-white/[0.04] p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs tracking-[0.24em] text-white/45 uppercase">
                Eight weeks of engine output
              </p>
              <p className="text-xs text-white/40">
                Sample block · beginner profile
              </p>
            </div>
            <div
              className="draw-x mt-5 h-px w-full bg-[linear-gradient(90deg,_rgba(18,91,255,0.8),_rgba(255,255,255,0.12))]"
              style={delay(150)}
            />

            <div className="mt-4 overflow-x-auto pb-1">
              <div className="grid min-w-[640px] grid-cols-[minmax(120px,1.3fr)_repeat(8,minmax(0,1fr))]">
                <div />
                {weekNumbers.map((week, column) => {
                  const mark = marksByWeek.get(week);
                  return (
                    <div
                      key={`head-${week}`}
                      className={`rv flex items-center justify-center px-1 py-3 ${
                        mark ? markColumnTints[mark.kind] : ""
                      }`}
                      style={delay(220 + column * 55)}
                    >
                      {mark ? (
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold tracking-[0.08em] uppercase ${markChipStyles[mark.kind]}`}
                        >
                          <span aria-hidden="true">
                            {markGlyphs[mark.kind]}
                          </span>
                          W{week}
                        </span>
                      ) : (
                        <span className="text-[0.68rem] tracking-[0.18em] text-white/40 uppercase">
                          W{week}
                        </span>
                      )}
                    </div>
                  );
                })}

                {proLedger.rows.map((row, rowIndex) => {
                  const isLastRow = rowIndex === proLedger.rows.length - 1;
                  const rowBorder = isLastRow
                    ? ""
                    : "border-b border-white/8";
                  return (
                    <Fragment key={row.name}>
                      <div
                        className={`rv flex items-center py-3 pr-3 text-sm font-medium text-white/85 ${rowBorder}`}
                        style={delay(420 + rowIndex * 130)}
                      >
                        {row.name}
                      </div>
                      {row.values.map((value, column) => {
                        const week = column + 1;
                        const mark = marksByWeek.get(week);
                        const isFinalWeek = week === proLedger.weekCount;
                        return (
                          <div
                            key={`${row.name}-${week}`}
                            className={`rv flex items-center justify-center py-3 font-display text-sm tabular-nums ${rowBorder} ${
                              mark ? markColumnTints[mark.kind] : ""
                            } ${
                              isFinalWeek
                                ? "font-semibold text-white"
                                : "text-white/65"
                            }`}
                            style={delay(420 + rowIndex * 130 + column * 45)}
                          >
                            {value}
                          </div>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              {proLedger.marks.map((mark, index) => (
                <span
                  key={`legend-${mark.week}`}
                  className={`rv inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${markChipStyles[mark.kind]}`}
                  style={delay(980 + index * 110)}
                >
                  <span aria-hidden="true">{markGlyphs[mark.kind]}</span>
                  W{mark.week} · {mark.label}
                </span>
              ))}
            </div>

            <p
              className="rv mt-5 font-display text-lg font-semibold tracking-[-0.02em] text-white/90"
              style={delay(1300)}
            >
              {proLedger.caption}
            </p>
          </div>
        </Reveal>

        <div className="mt-10 flex justify-start lg:justify-end">
          <Link
            href={siteConfig.ctaHref}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/25 underline-offset-8 transition hover:decoration-white"
          >
            Get the app
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
