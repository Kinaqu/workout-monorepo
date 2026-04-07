import Link from "next/link";
import { siteConfig } from "@/data/site-config";
import { ArrowIcon } from "./icons";

export function FinalCtaSection() {
  return (
    <section className="bg-[linear-gradient(180deg,_#09111d,_#05070b)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(18,91,255,0.26),_rgba(255,255,255,0.04)_38%,_rgba(255,255,255,0.02)_100%)] px-6 py-12 shadow-[0_40px_120px_rgba(5,7,11,0.55)] sm:px-10 lg:px-14 lg:py-16">
          <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[#125bff]/28 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="max-w-3xl">
              <p className="text-xs tracking-[0.3em] text-[#8ab4ff] uppercase">
                Final CTA
              </p>
              <h2 className="mt-5 font-display text-4xl leading-tight font-semibold tracking-[-0.05em] sm:text-5xl">
                Start with the level you actually have, not the one apps assume.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                Request early access, share your training context, and get into
                the first Kinova flow built around adaptive progression for
                real-life conditions.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
              <Link
                href={siteConfig.ctaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#05070b] transition hover:bg-[#dbe7ff]"
              >
                {siteConfig.ctaLabel}
                <ArrowIcon />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.06] px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
              >
                See What Happens Next
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
