import { progressionStates } from "@/data/landing-content";
import { SectionHeading } from "./section-heading";

export function ProgressionSection() {
  return (
    <section
      id="progression"
      className="bg-[linear-gradient(180deg,_#09111d,_#0b1626)] text-white"
    >
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-30">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
          <div className="max-w-2xl">
            <SectionHeading
              eyebrow="Adaptive Progression"
              title="Progression should respond to performance, readiness, and reality."
              description="Kinova treats progression like a live route. Strong sessions move the user forward. Rough sessions trigger smarter steps. Imperfect weeks do not erase momentum."
              inverse
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Signal", value: "Session feedback + adherence" },
                { label: "Response", value: "Advance, hold, or regress" },
                { label: "Outcome", value: "Consistency without chaos" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-4"
                >
                  <p className="text-[0.68rem] tracking-[0.24em] text-[#8ab4ff] uppercase">
                    {item.label}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/82">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-8 top-12 hidden h-[76%] w-px bg-[linear-gradient(180deg,_rgba(18,91,255,0.15),_rgba(18,91,255,0.85),_rgba(255,255,255,0.12))] lg:block" />
            <div className="space-y-6">
              {progressionStates.map((item, index) => (
                <article
                  key={item.title}
                  className="relative rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 pl-8 lg:pl-14"
                >
                  <div className="absolute left-5 top-8 flex h-7 w-7 items-center justify-center rounded-full border border-[#125bff]/50 bg-[#125bff] text-xs font-semibold text-white lg:left-[-13px]">
                    {index + 1}
                  </div>
                  <h3 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                    {item.title}
                  </h3>
                  <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
