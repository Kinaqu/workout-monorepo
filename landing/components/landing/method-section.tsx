import { methodologyPoints } from "@/data/landing-content";
import { CheckIcon } from "./icons";
import { SectionHeading } from "./section-heading";

export function MethodSection() {
  return (
    <section className="bg-[#05070b] text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
          <SectionHeading
            eyebrow="Methodology"
            title="The product earns trust when the training logic is visible."
            description="Visitors in this category expect more than aesthetics. Kinova should clearly communicate the principles behind its planning system: assessment first, realistic progression, and respect for the way real people train."
            inverse
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {methodologyPoints.map((point) => (
              <article
                key={point}
                className="rounded-[1.75rem] border border-white/10 bg-white/[0.05] p-5"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[#8ab4ff]">
                  <CheckIcon />
                </div>
                <p className="mt-4 text-base leading-7 text-white/80">{point}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
