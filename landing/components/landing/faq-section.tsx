import { faqs } from "@/data/landing-content";
import { SectionHeading } from "./section-heading";

export function FaqSection() {
  return (
    <section id="faq" className="bg-white text-[#05070b]">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="FAQ"
          title="Answers to the questions that usually block signup."
          description="Short answers on fit, equipment, session length, and what happens after you apply."
        />

        <div className="mt-14 grid gap-4">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-[1.75rem] border border-[#dbe4f2] bg-[#f8fbff] px-6 py-5 open:bg-white"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-xl font-semibold tracking-[-0.03em]">
                {item.question}
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9e3f3] text-[#125bff] transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-4 max-w-3xl pr-10 text-base leading-7 text-[#556274]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
