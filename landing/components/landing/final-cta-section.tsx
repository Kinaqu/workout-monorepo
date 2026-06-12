import Link from "next/link";
import { siteConfig } from "@/data/site-config";
import { ArrowIcon } from "./icons";

export function FinalCtaSection() {
  return (
    <section className="text-white">
      <div className="mx-auto max-w-7xl px-6 pb-24 sm:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(18,91,255,0.26),_rgba(255,255,255,0.04)_38%,_rgba(255,255,255,0.02)_100%)] px-6 py-12 shadow-[0_40px_120px_rgba(5,7,11,0.55)] sm:px-10 lg:px-14 lg:py-16">
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[#125bff]/28 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="max-w-3xl">
                <p className="text-xs tracking-[0.3em] text-[#8ab4ff] uppercase">
                  Get started
                </p>
                <h2 className="mt-5 font-display text-4xl leading-tight font-semibold tracking-[-0.05em] sm:text-5xl">
                  Hold the line free. Or train toward something.
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                  The daily minimum is free for everyone. Pro members get the
                  progression engine — apply once and the team follows up by
                  email.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                <Link
                  href={siteConfig.proCtaHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#05070b] transition hover:-translate-y-0.5 hover:bg-[#dbe7ff]"
                >
                  {siteConfig.proCtaLabel}
                  <ArrowIcon />
                </Link>
                <Link
                  href={siteConfig.ctaHref}
                  className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.06] px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/[0.1]"
                >
                  Start free
                </Link>
              </div>
            </div>
        </div>
      </div>
    </section>
  );
}
