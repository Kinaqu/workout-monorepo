import { audienceCards } from "@/data/landing-content";
import { SectionHeading } from "./section-heading";

export function AudienceSection() {
  return (
    <section id="for-you" className="bg-[#eef4ff] text-[#05070b]">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Who It's For"
          title="Best for people who want structure without gym assumptions."
          description="Kinova works when the user can recognize their setup, schedule, and current level immediately."
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {audienceCards.map((item) => (
            <article
              key={item.title}
              className="rounded-[2rem] border border-white bg-white p-6 shadow-[0_24px_70px_rgba(18,91,255,0.08)]"
            >
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
