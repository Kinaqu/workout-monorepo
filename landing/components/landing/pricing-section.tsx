"use client";

import { useState } from "react";
import { pricingTiers, type PricingTier } from "@/data/landing-content";
import { CheckIcon } from "./icons";
import { SectionHeading } from "./section-heading";

type Billing = "monthly" | "annual";

const money = (n: number) => (n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`);
const savingsPct = (tier: PricingTier) =>
  Math.round((1 - tier.priceAnnual / (tier.priceMonthly * 12)) * 100);

/* Quiet, cumulative tier comparison with a savings-forward annual toggle. There
   are no per-tier checkout buttons — the download badges are the CTA; pricing is
   handled in the app. All cards share the dark surface; Pro carries a brand tint
   and the "Recommended" pill (in flow, so it never overlaps the title). */
function TierCard({ tier, billing }: { tier: PricingTier; billing: Billing }) {
  const isFree = tier.priceMonthly === 0;
  const perMonth = billing === "annual" ? tier.priceAnnual / 12 : tier.priceMonthly;

  return (
    <article
      className={`relative flex h-full flex-col rounded-[1.75rem] border p-6 sm:p-7 ${
        tier.highlighted
          ? "border-[#125bff]/40 bg-[#0c1830]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      {/* Badge row — reserved height on every card so the three headers align
          and the pill can never sit on top of the title. */}
      <div className="mb-4 flex h-6 items-center justify-between gap-3">
        <p className="text-xs tracking-[0.22em] text-[#8ab4ff] uppercase">
          {tier.name}
        </p>
        {tier.badge ? (
          <span className="shrink-0 rounded-full border border-[#125bff]/30 bg-[#125bff]/15 px-2.5 py-0.5 text-[0.6rem] font-semibold tracking-[0.1em] text-[#9fbeff] uppercase">
            {tier.badge}
          </span>
        ) : null}
      </div>

      <p className="text-sm text-white/55">{tier.tagline}</p>

      <div className="mt-3 flex items-end gap-1.5">
        {isFree ? (
          <span className="font-display text-3xl font-semibold text-white">
            Free
          </span>
        ) : (
          <>
            <span className="font-display text-3xl font-semibold text-white tabular-nums">
              ${perMonth.toFixed(2)}
            </span>
            <span className="pb-1 text-sm text-white/55">/mo</span>
          </>
        )}
      </div>

      {/* Billing detail + savings — reserved height so cards stay aligned. */}
      <div className="mt-1.5 flex min-h-[1.5rem] flex-wrap items-center gap-2 text-xs text-white/45">
        {isFree ? (
          <span>Free, forever</span>
        ) : billing === "annual" ? (
          <>
            <span>billed {money(tier.priceAnnual)}/yr</span>
            <span className="rounded-full bg-[#1f7a4d]/25 px-2 py-0.5 font-semibold text-[#5ee0a0]">
              Save {savingsPct(tier)}%
            </span>
          </>
        ) : (
          <span>billed monthly</span>
        )}
      </div>

      <p className="mt-4 text-sm leading-6 text-white/60">{tier.description}</p>

      <ul className="mt-5 space-y-3 border-t border-white/8 pt-5">
        {tier.includes ? (
          <li className="text-sm font-semibold text-white/85">{tier.includes}</li>
        ) : null}
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
  const [billing, setBilling] = useState<Billing>("annual");

  return (
    <section id="pricing" className="relative text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-28">
        <SectionHeading
          inverse
          eyebrow="Plans"
          title="Pick a plan. Download to start."
          description="Free holds your baseline. Pro adds the progression engine; Premium adds a personal AI coach. Each plan includes everything below it — subscriptions are handled in the app."
        />

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <div className="inline-flex rounded-full border border-white/12 bg-white/[0.04] p-1">
            {(["monthly", "annual"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setBilling(option)}
                aria-pressed={billing === option}
                className={`rounded-full px-5 py-1.5 text-sm font-semibold capitalize transition ${
                  billing === option
                    ? "bg-white text-[#05070b]"
                    : "text-white/60 hover:text-white"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
          <span className="text-xs font-semibold tracking-wide text-[#5ee0a0]">
            Save up to 40% yearly
          </span>
        </div>

        <div className="mt-10 grid items-stretch gap-4 sm:gap-5 lg:grid-cols-3">
          {pricingTiers.map((tier) => (
            <TierCard key={tier.name} tier={tier} billing={billing} />
          ))}
        </div>
      </div>
    </section>
  );
}
