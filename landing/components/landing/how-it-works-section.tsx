import { type CSSProperties } from "react";
import { flowSteps } from "@/data/landing-content";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-[#05070b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-28">
        <Reveal>
          <SectionHeading
            inverse
            eyebrow="How it works · 20–45 minute sessions"
            title="Profile in. Week out. Signal back."
          />
        </Reveal>

        <Reveal stagger className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {flowSteps.map((step, index) => (
            <div
              key={step.number}
              className="rv rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-6"
              style={delay(index * 110)}
            >
              <p className="text-xs font-semibold tracking-[0.28em] text-[#8ab4ff] uppercase">
                {step.number}
              </p>
              <h3 className="mt-4 font-display text-xl font-semibold tracking-[-0.03em] text-white">
                {step.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/65">
                {step.description}
              </p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
