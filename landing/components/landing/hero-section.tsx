import Link from "next/link";
import { siteConfig } from "@/data/site-config";
import { ArrowIcon } from "./icons";
import { LandingHeader } from "./header";
import { HeroDemo } from "./hero-demo";
import { PointerGlow } from "./pointer-glow";

export function HeroSection() {
  return (
    <section className="hero-grid relative overflow-hidden border-b border-white/8">
      <div className="hero-radial absolute inset-0" />
      <div className="hero-sheen absolute inset-x-0 top-0 h-px" />
      <PointerGlow />
      <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-6 sm:px-8 lg:px-12 lg:pb-28">
        <LandingHeader />

        <div className="hero-enter inline-flex items-center gap-3 rounded-full border border-[#125bff]/20 bg-[#125bff]/10 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-[#9fbeff] uppercase">
          Early access open · Free + Pro waitlist
        </div>

        <h1 className="hero-enter mt-7 max-w-6xl font-display text-5xl leading-[0.95] font-semibold tracking-[-0.07em] text-white [animation-delay:100ms] sm:text-6xl lg:text-7xl xl:text-[5.25rem]">
          The daily minimum is free.
          <br />
          <span className="text-[#8ab4ff]">Progression is the product.</span>
        </h1>

        <div className="mt-12 grid gap-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-start lg:gap-10">
          <div className="relative z-10 max-w-xl">
            <p className="hero-enter text-lg leading-8 text-white/72 [animation-delay:220ms] sm:text-xl">
              Everyone gets a fixed daily routine to keep their baseline — ten
              push-ups, ten squats, ten dips, a plank. Pro members get an
              adaptive week that advances, holds, or regresses with how
              training actually goes.
            </p>

            <div className="hero-enter mt-9 flex flex-col gap-4 [animation-delay:340ms] sm:flex-row">
              <Link
                href={siteConfig.proCtaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#05070b] transition hover:-translate-y-0.5 hover:bg-[#dbe7ff]"
              >
                {siteConfig.proCtaLabel}
                <ArrowIcon />
              </Link>
              <a
                href="#daily-minimum"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                See the free daily routine
              </a>
            </div>

            <p className="hero-enter mt-8 text-sm leading-6 text-white/55 [animation-delay:420ms]">
              Bodyweight or minimal gear · 20–45 min sessions · built for
              imperfect weeks
            </p>
          </div>

          <div className="hero-enter relative [animation-delay:480ms] xl:-mt-14">
            <div className="blue-orb absolute -left-6 top-14 h-36 w-36 rounded-full bg-[#125bff]/24 blur-3xl" />
            <HeroDemo />
          </div>
        </div>
      </div>
    </section>
  );
}
