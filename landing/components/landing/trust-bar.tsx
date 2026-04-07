import { trustItems, trustStats } from "@/data/landing-content";

export function TrustBar() {
  return (
    <section className="border-b border-white/8 bg-[#05070b]">
      <div className="mx-auto max-w-7xl px-6 py-8 sm:px-8 lg:px-12">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5">
          <div className="flex flex-wrap gap-3 border-b border-white/8 pb-5">
            {trustItems.map((item) => (
              <div
                key={item}
                className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#0b111a] px-4 py-2 text-sm text-white/68"
              >
                <span className="h-2 w-2 rounded-full bg-[#125bff]" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {trustStats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-[1.5rem] border border-white/8 bg-[#08111f] p-5"
              >
                <p className="text-xs tracking-[0.26em] text-white/42 uppercase">
                  {stat.label}
                </p>
                <p className="mt-4 text-lg font-semibold text-white">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/62">
                  {stat.detail}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
