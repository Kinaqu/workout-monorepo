import { catalogTicker } from "@/data/landing-content";

export function CatalogMarquee() {
  return (
    <section
      aria-label="Exercise catalog sample"
      className="bg-[#08111f] py-5 text-white"
    >
      <div className="marquee-shell">
        <div className="marquee-track">
          {[0, 1].map((copy) =>
            catalogTicker.map((item) => (
              <span
                key={`${copy}-${item}`}
                aria-hidden={copy === 1}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm whitespace-nowrap text-white/64"
              >
                {item}
              </span>
            )),
          )}
        </div>
      </div>
    </section>
  );
}
