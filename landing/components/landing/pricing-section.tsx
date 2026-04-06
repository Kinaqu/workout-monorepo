import Link from "next/link";
import { pricingTiers } from "@/data/landing-content";
import { siteConfig } from "@/data/site-config";
import { ArrowIcon, CheckIcon } from "./icons";
import { SectionHeading } from "./section-heading";

export function PricingSection() {
  return (
    <section id="early-access" className="bg-[#f4f8ff] text-[#05070b]">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <SectionHeading
          eyebrow="Early Access"
          title="Apply for the first Kinova cohort."
          description="Share your setup, your goal, and how you train now. Kinova reviews fit and invites new users in focused batches."
        />

        <div className="mt-14 grid gap-5 lg:grid-cols-2">
          {pricingTiers.map((tier) => (
            <article
              key={tier.name}
              className={`rounded-[2rem] border p-6 ${
                tier.highlighted
                  ? "border-[#125bff]/20 bg-[#08111f] text-white shadow-[0_30px_90px_rgba(5,7,11,0.24)]"
                  : "border-[#dbe4f2] bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className={`text-xs tracking-[0.26em] uppercase ${
                      tier.highlighted ? "text-[#8ab4ff]" : "text-[#125bff]"
                    }`}
                  >
                    {tier.name}
                  </p>
                  <h3 className="mt-4 font-display text-3xl font-semibold tracking-[-0.04em]">
                    {tier.price}
                  </h3>
                </div>
                {tier.highlighted ? (
                  <span className="rounded-full border border-[#125bff]/30 bg-[#125bff]/12 px-3 py-1 text-xs font-semibold text-[#9fbeff]">
                    Recommended
                  </span>
                ) : null}
              </div>
              <p
                className={`mt-5 text-base leading-7 ${
                  tier.highlighted ? "text-white/72" : "text-[#526072]"
                }`}
              >
                {tier.description}
              </p>
              <div className="mt-6 space-y-3">
                {tier.points.map((point) => (
                  <div
                    key={point}
                    className={`inline-flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                      tier.highlighted
                        ? "border-white/8 bg-white/[0.04] text-white/82"
                        : "border-[#dbe4f2] bg-[#f8fbff] text-[#243041]"
                    }`}
                  >
                    <span
                      className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
                        tier.highlighted
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
              {tier.highlighted ? (
                <Link
                  href={siteConfig.ctaHref}
                  className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#05070b] transition hover:bg-[#dbe7ff]"
                >
                  Join Early Access
                  <ArrowIcon />
                </Link>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
