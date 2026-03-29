import { BrandLogo } from "@/components/brand-logo";

const workoutBlocks = [
  {
    label: "Prep",
    title: "Shoulder mobility flow",
    detail: "4 minutes",
  },
  {
    label: "Main set",
    title: "Push + pull progression",
    detail: "3 rounds",
  },
  {
    label: "Finisher",
    title: "Core stability ladder",
    detail: "6 minutes",
  },
];

const progressionPath = [
  "Incline push-up mastered",
  "Standard push-up unlocked",
  "Tempo push-up added next",
];

export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[560px]">
      <div className="pulse-soft absolute -right-8 -top-10 h-40 w-40 rounded-full bg-[color:rgba(47,107,255,0.28)] blur-3xl" />
      <div className="pulse-soft absolute -bottom-6 left-6 h-28 w-28 rounded-full bg-[color:rgba(120,167,255,0.18)] blur-3xl" />

      <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,rgba(11,19,36,0.98),rgba(8,13,24,0.96))] p-5 shadow-[0_30px_90px_rgba(1,9,26,0.55)] sm:p-6">
        <div className="bg-grid absolute inset-0 opacity-40" />
        <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(120,167,255,0.7),transparent)]" />

        <div className="relative flex items-center justify-between gap-4">
          <BrandLogo showWordmark={false} size={36} priority />
          <div className="rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/70">
            Personal training that adapts
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 md:grid-cols-[1.08fr_.92fr]">
          <div className="rounded-[1.7rem] border border-white/12 bg-white/[0.04] p-5 backdrop-blur-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.28em] text-white/52">
                  Today&apos;s plan
                </div>
                <h3 className="font-display mt-2 text-2xl font-semibold text-white">
                  Upper body reset
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/68">
                  Tuned for home training, shoulder comfort, and steady strength
                  progress.
                </p>
              </div>
              <div className="rounded-2xl border border-[color:rgba(120,167,255,0.28)] bg-[color:rgba(47,107,255,0.14)] px-3 py-2 text-right">
                <div className="text-[0.7rem] uppercase tracking-[0.24em] text-white/55">
                  Session
                </div>
                <div className="font-display mt-1 text-xl text-white">22 min</div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {workoutBlocks.map((block) => (
                <div
                  key={block.title}
                  className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-white/10 bg-black/18 px-4 py-3"
                >
                  <div>
                    <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/45">
                      {block.label}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-white/92">
                      {block.title}
                    </div>
                  </div>
                  <div className="text-sm text-white/62">{block.detail}</div>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4">
                <div className="text-[0.68rem] uppercase tracking-[0.26em] text-white/45">
                  Training mode
                </div>
                <div className="mt-2 text-base font-semibold text-white">
                  Home + bodyweight
                </div>
              </div>
              <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4">
                <div className="text-[0.68rem] uppercase tracking-[0.26em] text-white/45">
                  Current level
                </div>
                <div className="mt-2 text-base font-semibold text-white">
                  Foundation 03
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[1.7rem] border border-white/12 bg-[linear-gradient(180deg,rgba(10,20,38,0.92),rgba(6,12,24,0.86))] p-5">
              <div className="text-xs uppercase tracking-[0.28em] text-white/52">
                Adaptive progression
              </div>
              <div className="mt-4 space-y-3">
                {progressionPath.map((item, index) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:rgba(120,167,255,0.4)] bg-[color:rgba(47,107,255,0.16)] text-xs font-semibold text-white">
                      0{index + 1}
                    </div>
                    <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.04] px-3.5 py-3 text-sm leading-6 text-white/78">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.7rem] border border-[color:rgba(120,167,255,0.28)] bg-[linear-gradient(180deg,rgba(47,107,255,0.18),rgba(8,13,24,0.9))] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/58">
                    Readiness
                  </div>
                  <div className="font-display mt-2 text-4xl font-semibold text-white">
                    86%
                  </div>
                </div>
                <div className="rounded-2xl border border-white/15 px-3 py-2 text-xs uppercase tracking-[0.24em] text-white/68">
                  Route updated
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/74">
                Strong form today, so Kinova increases challenge without
                breaking rhythm.
              </p>
              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[86%] rounded-full bg-[linear-gradient(90deg,#2f6bff,#86b6ff)]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="float-slow absolute -left-4 top-12 hidden rounded-full border border-white/12 bg-[rgba(5,10,18,0.92)] px-4 py-2 text-xs uppercase tracking-[0.24em] text-white/68 shadow-[0_16px_35px_rgba(3,7,16,0.45)] sm:block">
        Home. Outdoor. Gym-light.
      </div>
      <div className="float-delayed absolute -bottom-5 right-4 hidden rounded-[1.2rem] border border-[color:rgba(120,167,255,0.32)] bg-[rgba(8,15,28,0.92)] px-4 py-3 text-sm leading-6 text-white/74 shadow-[0_18px_40px_rgba(3,7,16,0.5)] sm:block">
        Progress is strong.
        <br />
        Next step unlocked for tomorrow.
      </div>
    </div>
  );
}
