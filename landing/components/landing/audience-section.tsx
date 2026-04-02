import { audienceCards } from "@/data/landing-content";
import { SectionHeading } from "./section-heading";

export function AudienceSection() {
  return (
    <section id="for-you" className="bg-[#eef4ff] text-[#05070b]">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="For You"
          title="Built for people with real constraints, not idealized fitness lives."
          description="The story should help visitors recognize themselves quickly. Kinova works best when the user sees that their level, setup, and schedule are already part of the design."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {audienceCards.map((item) => (
            <article
              key={item.title}
              className="rounded-[2rem] border border-white bg-white p-6 shadow-[0_24px_70px_rgba(18,91,255,0.08)]"
            >
              <p className="text-xs tracking-[0.24em] text-[#125bff] uppercase">
                Use case
              </p>
              <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.04em] text-[#09111d]">
                {item.title}
              </h3>
              <p className="mt-4 text-base leading-7 text-[#526072]">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
