import { type CSSProperties } from "react";
import { faqs } from "@/data/landing-content";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const delay = (ms: number) => ({ "--d": `${ms}ms` }) as CSSProperties;

export function FaqSection() {
  return (
    <section id="faq" className="bg-[#05070b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <Reveal>
          <SectionHeading
            inverse
            eyebrow="FAQ"
            title="The questions that decide it."
            description="Short answers on what's free, what Pro does, and what happens after you apply."
          />
        </Reveal>

        <Reveal stagger className="mt-14 grid gap-4">
          {faqs.map((item, index) => (
            <details
              key={item.question}
              className="rv group rounded-[1.75rem] border border-white/10 bg-white/[0.03] px-6 py-5 open:bg-white/[0.05]"
              style={delay(index * 70)}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-semibold tracking-[-0.03em] text-white sm:text-xl">
                {item.question}
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/14 text-[#8ab4ff] transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-3xl pr-10 text-base leading-7 text-white/65">
                {item.answer}
              </p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
