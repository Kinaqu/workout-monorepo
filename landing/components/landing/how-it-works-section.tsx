import { flowSteps } from "@/data/landing-content";
import { SectionHeading } from "./section-heading";

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white text-[#05070b]">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading
          eyebrow="How It Works"
          title="A product flow that starts with the user, then adapts the route."
          description="Kinova is not a content feed disguised as a plan. It begins with a fit check, builds a week that matches reality, and uses session signals to shape what comes next."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {flowSteps.map((step) => (
            <article
              key={step.number}
              className="rounded-[2rem] border border-[#dbe4f2] bg-[#f7faff] p-6 shadow-[0_24px_70px_rgba(18,91,255,0.06)]"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-semibold tracking-[0.28em] text-[#125bff] uppercase">
                  {step.number}
                </p>
                <div className="rounded-full border border-[#cfe0ff] bg-white px-3 py-1 text-[0.68rem] font-semibold tracking-[0.2em] text-[#125bff] uppercase">
                  Product state
                </div>
              </div>
              <h3 className="mt-5 font-display text-2xl leading-tight font-semibold tracking-[-0.04em]">
                {step.title}
              </h3>
              <p className="mt-4 text-base leading-7 text-[#526072]">
                {step.description}
              </p>
              <div className="mt-6 rounded-[1.4rem] border border-[#dbe4f2] bg-white p-4">
                <p className="text-[0.68rem] tracking-[0.24em] text-[#125bff] uppercase">
                  {step.detailLabel}
                </p>
                <p className="mt-3 text-sm leading-6 font-medium text-[#1d2837]">
                  {step.detailValue}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
