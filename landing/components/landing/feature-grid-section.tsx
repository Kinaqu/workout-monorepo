import { featureCards } from "@/data/landing-content";
import { CheckIcon } from "./icons";
import { SectionHeading } from "./section-heading";

export function FeatureGridSection() {
  return (
    <section className="bg-[#07101a] text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Why It Sticks"
          title="A plan that reacts like a system, not a content library."
          description="The value is not more workouts. The value is a weekly plan that stays useful when real life hits."
          inverse
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-4">
          {featureCards.map((card) => (
            <article
              key={card.title}
              className={`group relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 ${card.span}`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-100 transition duration-300 group-hover:opacity-80`}
              />
              <div className="relative">
                <p className="text-xs tracking-[0.26em] text-[#8ab4ff] uppercase">
                  {card.eyebrow}
                </p>
                <h3 className="mt-4 max-w-md font-display text-2xl font-semibold tracking-[-0.04em] text-white sm:text-[2rem]">
                  {card.title}
                </h3>
                <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
                  {card.body}
                </p>
                <div className="mt-6 space-y-3">
                  {card.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="inline-flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-[#09111d]/80 px-4 py-3 text-sm text-white/82"
                    >
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[#8ab4ff]">
                        <CheckIcon />
                      </span>
                      {bullet}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
