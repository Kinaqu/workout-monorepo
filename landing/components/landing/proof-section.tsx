import { outcomeCards, testimonials } from "@/data/landing-content";
import { SectionHeading } from "./section-heading";

export function ProofSection() {
  return (
    <section id="results" className="bg-white text-[#05070b]">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-start">
          <SectionHeading
            eyebrow="What Changes"
            title="The win is a plan you can keep following."
            description="Kinova is built to make consistency feel realistic, progression feel legible, and rough weeks less expensive."
          />

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {outcomeCards.map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-[1.75rem] border border-[#dbe4f2] bg-[#f8fbff] p-5"
                >
                  <p className="text-xs tracking-[0.24em] text-[#125bff] uppercase">
                    0{index + 1}
                  </p>
                  <h3 className="mt-4 text-lg font-semibold text-[#09111d]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#526072]">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>

            <div className="rounded-[1.75rem] border border-[#dbe4f2] bg-[#f8fbff] p-6">
              <p className="text-xs tracking-[0.26em] text-[#125bff] uppercase">
                Early-access focus
              </p>
              <p className="mt-4 max-w-3xl font-display text-3xl leading-tight font-semibold tracking-[-0.04em] text-[#09111d] sm:text-4xl">
                Built for people who need the next right session, not another
                endless workout feed.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {testimonials.map((item) => (
                <article
                  key={item.quote}
                  className="rounded-[1.75rem] border border-[#dbe4f2] bg-white p-5 shadow-[0_20px_60px_rgba(18,91,255,0.06)]"
                >
                  <p className="text-base leading-7 text-[#223041]">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div className="mt-5 border-t border-[#dbe4f2] pt-4">
                    <p className="text-sm font-semibold text-[#09111d]">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-[#5c697a]">{item.role}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
