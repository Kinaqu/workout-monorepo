import { comparisonRows } from "@/data/landing-content";
import { SectionHeading } from "./section-heading";

export function ComparisonSection() {
  return (
    <section className="bg-white text-[#05070b]">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <SectionHeading
            eyebrow="Why Kinova Is Different"
            title="The product adjusts the route instead of forcing the user into a preset script."
            description="Most workout apps hand over content and call it personalization. Kinova is built around fit, progression, and adherence that can survive imperfect weeks."
          />

          <div className="overflow-hidden rounded-[2rem] border border-[#d9e3f3]">
            <div className="grid grid-cols-2 bg-[#08111f] text-white">
              <div className="border-r border-white/8 px-6 py-5">
                <p className="text-xs tracking-[0.26em] text-white/45 uppercase">
                  Generic workout apps
                </p>
              </div>
              <div className="bg-[linear-gradient(180deg,_rgba(18,91,255,0.24),_rgba(18,91,255,0.12))] px-6 py-5">
                <p className="text-xs tracking-[0.26em] text-[#9fbeff] uppercase">
                  Kinova
                </p>
              </div>
            </div>

            {comparisonRows.map((row) => (
              <div
                key={row.generic}
                className="grid grid-cols-1 border-t border-[#d9e3f3] bg-white sm:grid-cols-2"
              >
                <div className="border-b border-[#d9e3f3] px-6 py-5 text-base leading-7 text-[#6a7584] sm:border-b-0 sm:border-r">
                  {row.generic}
                </div>
                <div className="bg-[#f8fbff] px-6 py-5 text-base leading-7 font-medium text-[#132133]">
                  {row.kinova}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
