import Link from "next/link";
import { pricingTiers, type PricingTier } from "@/data/landing-content";
import { ArrowIcon, CheckIcon } from "./icons";
import { SectionHeading } from "./section-heading";

function TierCardBody({ tier }: { tier: PricingTier }) {
  const dark = tier.highlighted;
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-xs tracking-[0.26em] uppercase ${
              dark ? "text-[#8ab4ff]" : "text-[#125bff]"
            }`}
          >
            {tier.name} · {tier.tagline}
          </p>
          <h3 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em]">
            {tier.priceLabel}
          </h3>
        </div>
        {tier.badge ? (
          <span className="rounded-full border border-[#125bff]/30 bg-[#125bff]/12 px-3 py-1 text-xs font-semibold text-[#9fbeff]">
            {tier.badge}
          </span>
        ) : null}
      </div>
      <p
        className={`mt-5 text-base leading-7 ${
          dark ? "text-white/72" : "text-[#526072]"
        }`}
      >
        {tier.description}
      </p>
      <div className="mt-6 space-y-3">
        {tier.points.map((point) => (
          <div
            key={point}
            className={`inline-flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
              dark
                ? "border-white/8 bg-white/[0.04] text-white/82"
                : "border-[#dbe4f2] bg-[#f8fbff] text-[#243041]"
            }`}
          >
            <span
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                dark
                  ? "border border-white/10 bg-white/[0.05] text-[#8ab4ff]"
                  : "bg-[#125bff] text-white"
              }`}
            >
              <CheckIcon />
            </span>
            {point}
          </div>
        ))}
      </div>
      <Link
        href={tier.ctaHref}
        className={`mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 ${
          dark
            ? "bg-white text-[#05070b] hover:bg-[#dbe7ff]"
            : "border border-[#c6d4ea] bg-white text-[#05070b] hover:bg-[#eef4ff]"
        }`}
      >
        {tier.ctaLabel}
        <ArrowIcon />
      </Link>
      {tier.footnote ? (
        <p
          className={`mt-4 text-sm leading-6 ${
            dark ? "text-white/50" : "text-[#7a8698]"
          }`}
        >
          {tier.footnote}
        </p>
      ) : null}
    </>
  );
}

export function PricingSection() {
  return (
    <section id="pricing" className="relative text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading
          inverse
          eyebrow="Pricing"
          title={
            <>
              Free holds the line.{" "}
              <span className="whitespace-nowrap">Pro moves it.</span>
            </>
          }
          description="The daily minimum is free for everyone, forever. The progression engine is what you pay for — once it has a price."
        />

        <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-2">
          {pricingTiers.map((tier) =>
            tier.highlighted ? (
              <div
                key={tier.name}
                className="border-spin rounded-[2rem] bg-[#23355c] p-px"
              >
                <article className="relative h-full rounded-[calc(2rem-1px)] bg-[#08111f] p-6 text-white sm:p-7">
                  <TierCardBody tier={tier} />
                </article>
              </div>
            ) : (
              <article
                key={tier.name}
                className="rounded-[2rem] border border-[#dbe4f2] bg-white p-6 text-[#05070b] sm:p-7"
              >
                <TierCardBody tier={tier} />
              </article>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
