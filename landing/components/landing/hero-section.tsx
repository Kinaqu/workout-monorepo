import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { heroHighlights } from "@/data/landing-content";
import { siteConfig } from "@/data/site-config";
import { ArrowIcon, CheckIcon } from "./icons";
import { LandingHeader } from "./header";

export function HeroSection() {
  return (
    <section className="hero-grid relative overflow-hidden border-b border-white/8">
      <div className="hero-radial absolute inset-0" />
      <div className="hero-sheen absolute inset-x-0 top-0 h-px" />
      <div className="mx-auto max-w-7xl px-6 pb-24 pt-6 sm:px-8 lg:px-12 lg:pb-26">
        <LandingHeader />

        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.96fr)_minmax(420px,1.04fr)]">
          <div className="relative z-10 max-w-xl">
            <div className="mb-7 inline-flex items-center gap-3 rounded-full border border-[#125bff]/20 bg-[#125bff]/10 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-[#9fbeff] uppercase">
              Early access now open
            </div>

            <h1 className="font-display text-5xl leading-[0.9] font-semibold tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
              Adaptive strength plans
              <br />
              for the setup
              <br />
              <span className="text-[#8ab4ff]">you actually have.</span>
            </h1>

            <p className="mt-7 max-w-lg text-lg leading-8 text-white/72 sm:text-xl">
              Kinova builds your week around your current level, schedule, and
              equipment, then adapts when the signal says push, hold, or scale
              back.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href={siteConfig.ctaHref}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#05070b] transition hover:bg-[#dbe7ff]"
              >
                Join Early Access
                <ArrowIcon />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                See How It Works
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/64">
              {["Home or park ready", "Bodyweight or minimal gear", "Built for imperfect weeks"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {heroHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] px-5 py-5"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6 text-[#8ab4ff]">
                    <CheckIcon />
                  </div>
                  <p className="mt-4 text-sm leading-6 font-medium text-white/90">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:pl-6">
            <div className="blue-orb absolute -left-6 top-14 h-36 w-36 rounded-full bg-[#125bff]/24 blur-3xl" />
            <div className="blue-orb absolute right-4 top-0 h-28 w-28 rounded-full bg-[#125bff]/20 blur-3xl" />

            <div className="float-card relative mx-auto max-w-[37rem] rounded-[2.2rem] border border-white/12 bg-[linear-gradient(180deg,_rgba(10,13,19,0.98),_rgba(6,9,13,0.92))] p-5 shadow-[0_32px_120px_rgba(5,7,11,0.72)]">
              <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.04] p-5 sm:p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <BrandLogo showName={false} imageClassName="h-9" />
                    <div>
                      <p className="text-xs tracking-[0.22em] text-white/48 uppercase">
                        Sample week
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
                          Weekly load
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

              <div className="float-badge absolute -bottom-6 right-6 rounded-3xl border border-white/10 bg-[#0b111a] px-5 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
                <p className="text-[0.68rem] tracking-[0.24em] text-white/45 uppercase">
                  This week
                </p>
                <p className="mt-2 text-sm font-semibold text-white">
                  Four useful sessions. No reset required.
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#125bff]" />
                  <span className="text-sm text-white/70">
                    Kinova keeps the route clear after imperfect days
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
