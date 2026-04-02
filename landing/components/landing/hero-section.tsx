import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { heroHighlights } from "@/data/landing-content";
import { siteConfig } from "@/data/site-config";
import { ArrowIcon, CheckIcon, StarIcon } from "./icons";
import { LandingHeader } from "./header";

export function HeroSection() {
  return (
    <section className="hero-grid relative overflow-hidden border-b border-white/8">
      <div className="hero-radial absolute inset-0" />
      <div className="hero-sheen absolute inset-x-0 top-0 h-px" />
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-6 sm:px-8 lg:px-12 lg:pb-28">
        <LandingHeader />

        <div className="grid items-center gap-16 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-white/72 uppercase">
              <BrandLogo
                showName={false}
                imageClassName="h-6"
                className="shrink-0"
              />
              Adaptive planning for your real level
            </div>

            <h1 className="font-display max-w-4xl text-5xl leading-[0.92] font-semibold tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
              Train with a plan
              <br />
              that fits the body,
              <br />
              week, and level
              <span className="text-[#8ab4ff]"> you have now.</span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-white/72 sm:text-xl">
              Kinova builds adaptive training around your current ability,
              schedule, and setup, then adjusts the route when progress is
              strong, recovery dips, or life gets noisy.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href={siteConfig.ctaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#05070b] transition hover:bg-[#dbe7ff]"
              >
                {siteConfig.ctaLabel}
                <ArrowIcon />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-white/60">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                <div className="flex items-center gap-0.5 text-[#ffd66b]">
                  <StarIcon />
                  <StarIcon />
                  <StarIcon />
                  <StarIcon />
                  <StarIcon />
                </div>
                Early-access driven product development
              </div>
              <span>No generic workouts. No gym-first assumptions.</span>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {heroHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-white/10 bg-white/6 px-5 py-5"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6 text-[#8ab4ff]">
                    <CheckIcon />
                  </div>
                  <p className="mt-4 text-sm leading-6 font-medium text-white/92">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="blue-orb absolute -left-8 top-12 h-40 w-40 rounded-full bg-[#125bff]/30 blur-3xl" />
            <div className="blue-orb absolute right-0 top-0 h-32 w-32 rounded-full bg-[#125bff]/28 blur-3xl" />

            <div className="float-card relative mx-auto max-w-[36rem] rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,_rgba(10,13,19,0.98),_rgba(6,9,13,0.92))] p-5 shadow-[0_32px_120px_rgba(5,7,11,0.72)]">
              <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-5 sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <BrandLogo showName={false} imageClassName="h-9" />
                    <div>
                      <p className="text-xs tracking-[0.22em] text-white/48 uppercase">
                        Fit check result
                      </p>
                      <p className="mt-1 text-base font-semibold text-white">
                        Beginner pull strength track
                      </p>
                    </div>
                  </div>
                  <div className="rounded-full border border-[#125bff]/40 bg-[#125bff]/14 px-3 py-1 text-xs font-semibold text-[#9fbeff]">
                    Week 04 active
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-white/8 bg-[#0b111a] p-5">
                  <div className="grid gap-5 sm:grid-cols-[1.08fr_0.92fr]">
                    <div className="space-y-4">
                      {[
                        {
                          phase: "Assessment",
                          title: "Bands + pull-up bar + floor space",
                          time: "Context",
                        },
                        {
                          phase: "Today",
                          title: "Assisted pull-up ladder + core hold block",
                          time: "31 min",
                        },
                        {
                          phase: "Next step",
                          title: "Volume holds steady, tempo gets cleaner",
                          time: "Adaptive",
                        },
                      ].map((item, index) => (
                        <div
                          key={item.phase}
                          className={`rounded-2xl border px-4 py-4 ${
                            index === 1
                              ? "border-[#125bff]/45 bg-[#125bff]/11"
                              : "border-white/8 bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-[0.68rem] tracking-[0.22em] text-white/46 uppercase">
                                {item.phase}
                              </p>
                              <p className="mt-2 text-sm font-semibold text-white">
                                {item.title}
                              </p>
                            </div>
                            <span className="rounded-full border border-white/8 px-3 py-1 text-xs text-white/65">
                              {item.time}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[0.68rem] tracking-[0.22em] text-white/46 uppercase">
                          Weekly structure
                        </p>
                        <div className="mt-4 flex items-end justify-between">
                          {["Mon", "Tue", "Thu", "Sat"].map((day, index) => (
                            <div
                              key={day}
                              className="flex flex-col items-center gap-2"
                            >
                              <div
                                className={`w-9 rounded-full ${
                                  index === 1
                                    ? "h-28 bg-[#125bff]"
                                    : index === 2
                                      ? "h-20 bg-white/26"
                                      : "h-14 bg-white/14"
                                }`}
                              />
                              <span className="text-[0.68rem] text-white/42">
                                {day}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-[0.68rem] tracking-[0.22em] text-white/46 uppercase">
                              Progress path
                            </p>
                            <p className="mt-2 text-sm font-semibold text-white">
                              Ring row to controlled pull-up
                            </p>
                          </div>
                          <span className="text-2xl font-semibold text-[#8ab4ff]">
                            68%
                          </span>
                        </div>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full w-[68%] rounded-full bg-[linear-gradient(90deg,_#125bff,_#7db1ff)]" />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#125bff]/28 bg-[#125bff]/11 p-4">
                        <p className="text-[0.68rem] tracking-[0.22em] text-[#9fbeff] uppercase">
                          Adaptive update
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white">
                          Grip fatigue was high last session.
                        </p>
                        <p className="mt-2 text-sm leading-6 text-white/70">
                          Kinova trims today&apos;s volume slightly, keeps the
                          progression path alive, and protects the streak.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="float-badge absolute -left-5 top-16 rounded-3xl border border-white/12 bg-white/92 px-4 py-4 text-[#05070b] shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
                <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[#125bff] uppercase">
                  Signal captured
                </p>
                <p className="mt-2 text-sm font-semibold">
                  Fit check places the user correctly
                </p>
                <p className="mt-1 max-w-[13rem] text-sm leading-6 text-[#475164]">
                  Home setup, 30-minute sessions, entry-level pull strength.
                </p>
              </div>

              <div className="float-badge absolute -bottom-6 right-6 rounded-3xl border border-white/10 bg-[#0b111a] px-5 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
                <p className="text-[0.68rem] tracking-[0.24em] text-white/45 uppercase">
                  Momentum
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Four useful training weeks in a row
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#125bff]" />
                  <span className="text-sm text-white/70">
                    Progression stays clear even after rough sessions
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
