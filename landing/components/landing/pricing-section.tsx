import { pricingTiers, type PricingTier } from "@/data/landing-content";
import { CheckIcon } from "./icons";
import { SectionHeading } from "./section-heading";

/* Quiet, informational tier comparison. Pricing is chosen inside the app, so
   there are no per-tier checkout buttons here — the download badges are the CTA.
   All three cards share the dark surface; Pro carries a subtle brand tint. */
function TierCard({ tier }: { tier: PricingTier }) {
  return (
    <article
      className={`relative flex h-full flex-col rounded-[1.75rem] border p-6 sm:p-7 ${
        tier.highlighted
          ? "border-[#125bff]/40 bg-[#0c1830]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {tier.badge ? (
        <span className="absolute top-6 right-5 rounded-full border border-[#125bff]/30 bg-[#125bff]/12 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.08em] text-[#9fbeff] uppercase">
          {tier.badge}
        </span>
      ) : null}

      <p className="text-xs tracking-[0.22em] text-[#8ab4ff] uppercase">
        {tier.name} · {tier.tagline}
      </p>
      <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.03em] text-white">
        {tier.priceLabel}
      </h3>
      <p className="mt-3 text-sm leading-6 text-white/60">{tier.description}</p>

      <ul className="mt-5 space-y-3 border-t border-white/8 pt-5">
        {tier.points.map((point) => (
          <li
            key={point}
            className="flex items-start gap-2.5 text-sm leading-6 text-white/75"
          >
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-[#8ab4ff]">
              <CheckIcon />
            </span>
            {point}
          </li>
        ))}
      </ul>
    </article>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="relative text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading
          inverse
          eyebrow="Plans"
          title="Three plans. Choose inside the app."
          description="Everyone gets a free daily routine. Pro adds the progression engine; Premium adds a personal AI coach. Pricing lives in the app — download to pick yours."
        />

        <div className="mt-12 grid items-stretch gap-4 sm:gap-5 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <TierCard key={tier.name} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}
