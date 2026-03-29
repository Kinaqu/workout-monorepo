import { BrandLogo } from "@/components/brand-logo";

const navLinks = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Benefits", href: "#benefits" },
  { label: "Progression", href: "#progression" },
  { label: "FAQ", href: "#faq" },
];

const steps = [
  {
    number: "01",
    title: "Tell Kinova where you are now",
    description:
      "Share your goals, training background, schedule, and conditions so your plan starts at a level that fits real life.",
  },
  {
    number: "02",
    title: "Get a plan built around your level",
    description:
      "Receive a clear weekly structure with focused sessions, progression targets, and a path that feels challenging without being unrealistic.",
  },
  {
    number: "03",
    title: "Train, log, and keep momentum",
    description:
      "Complete sessions, track what felt strong or difficult, and build consistency with guidance that is easy to follow.",
  },
  {
    number: "04",
    title: "Let the plan adapt as you improve",
    description:
      "When you are ready, difficulty rises. When you need a better entry point, Kinova adjusts the route and keeps you moving forward.",
  },
];

const benefits = [
  "Start at your real level, not an assumed one.",
  "Build around home workouts, outdoor sessions, or minimal equipment.",
  "Remove the guesswork from what to do next.",
  "Progress with adaptive difficulty instead of random intensity.",
  "Stay more consistent with a plan that fits your week.",
  "Follow a clear path toward strength, movement quality, and confidence.",
];

const comparisonRows = [
  {
    generic: "The same plan for everyone",
    kinova: "Personalized around your level, goals, and training conditions",
  },
  {
    generic: "Too hard, too easy, or both",
    kinova: "Adjusts difficulty so progress stays sustainable",
  },
  {
    generic: "Random sessions with no clear path",
    kinova: "Structured progressions that build toward a real result",
  },
  {
    generic: "Easy to fall off after a bad week",
    kinova: "Designed to adapt and keep momentum alive",
  },
];

const audience = [
  {
    title: "Beginners",
    description:
      "Start with guidance that respects your current ability and builds foundations the right way.",
  },
  {
    title: "Returning athletes",
    description:
      "Ease back into training with structure that helps you rebuild without overdoing it.",
  },
  {
    title: "Home training users",
    description:
      "Get a plan that works in small spaces, with limited equipment, and real-world schedules.",
  },
  {
    title: "Outdoor and bodyweight users",
    description:
      "Progress through calisthenics-style movement patterns and adaptable session formats.",
  },
  {
    title: "People who want structure",
    description:
      "Know what to do, why you are doing it, and how each session connects to the bigger goal.",
  },
  {
    title: "People who want real progress",
    description:
      "Train with a plan that evolves instead of repeating the same loop without direction.",
  },
];

const progressionStates = [
  {
    title: "Push when ready",
    description:
      "Strong sessions unlock the next step, with challenge increasing gradually instead of all at once.",
  },
  {
    title: "Adjust when needed",
    description:
      "If a movement is not there yet, Kinova shifts you to a smarter progression step instead of stalling you out.",
  },
  {
    title: "Keep the line moving",
    description:
      "A step back is treated like strategy, not failure, so your progress stays alive even when the week gets messy.",
  },
];

const outcomes = [
  "Build consistency with a plan that is easier to stick to",
  "Improve movement quality and training confidence",
  "Get stronger without relying on random workouts",
  "Follow a progression that matches your actual pace",
  "Reach meaningful goals over time with less friction",
];

const faqs = [
  {
    question: "Is Kinova good for beginners?",
    answer:
      "Yes. Kinova starts from your current level and builds a plan that feels approachable, clear, and realistic from day one.",
  },
  {
    question: "What if I cannot do some exercises yet?",
    answer:
      "That is built into the experience. If something is too advanced, Kinova adjusts the route and gives you a better progression step so you can keep improving.",
  },
  {
    question: "Can I train at home or outdoors?",
    answer:
      "Yes. Kinova is built for flexible training conditions, including home setups, parks, and bodyweight-focused routines.",
  },
  {
    question: "Do I need equipment?",
    answer:
      "Not necessarily. Plans can be shaped around bodyweight work or minimal equipment depending on your setup.",
  },
  {
    question: "What if I only have limited time?",
    answer:
      "Kinova can shape your plan around the time you actually have, so training stays practical and easier to maintain week after week.",
  },
  {
    question: "How is this different from other workout apps?",
    answer:
      "Most apps give you content. Kinova gives you an evolving plan. It is structured around your level, adapts with your results, and keeps guiding you toward a goal that fits.",
  },
];

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className="h-4 w-4"
    >
      <path
        d="M7 17L17 7M17 7H8.5M17 7V15.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
  inverse = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  inverse?: boolean;
}) {
  return (
    <div className="max-w-3xl">
      <p
        className={`mb-4 text-xs font-semibold tracking-[0.28em] uppercase ${
          inverse ? "text-[#8ab4ff]" : "text-[#125bff]"
        }`}
      >
        {eyebrow}
      </p>
      <h2
        className={`font-display text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-4xl lg:text-5xl ${
          inverse ? "text-white" : "text-[#05070b]"
        }`}
      >
        {title}
      </h2>
      <p
        className={`mt-5 max-w-2xl text-base leading-8 sm:text-lg ${
          inverse ? "text-white/72" : "text-[#3b4556]"
        }`}
      >
        {description}
      </p>
    </div>
  );
}

export default function Home() {
  return (
    <main className="bg-[#05070b] text-white">
      <section className="hero-grid relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(18,91,255,0.26),_transparent_40%),radial-gradient(circle_at_80%_10%,_rgba(255,255,255,0.08),_transparent_24%),linear-gradient(180deg,_#05070b_0%,_#08111f_55%,_#05070b_100%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/12" />
        <div className="mx-auto max-w-7xl px-6 pb-18 pt-6 sm:px-8 lg:px-12">
          <header className="sticky top-4 z-30 mb-14 rounded-full border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-6">
              <BrandLogo
                priority
                subtitle="Adaptive Workout App"
                imageClassName="h-10 sm:h-11"
                titleClassName="text-sm sm:text-base"
              />

              <nav
                aria-label="Primary navigation"
                className="hidden items-center gap-8 lg:flex"
              >
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="text-sm font-medium text-white/72 transition hover:text-white"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <a
                href="#final-cta"
                className="inline-flex items-center gap-2 rounded-full bg-[#125bff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2e72ff]"
              >
                Start Your Plan
                <ArrowIcon />
              </a>
            </div>
          </header>

          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]">
            <div className="relative z-10 max-w-2xl">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-white/72 uppercase">
                <BrandLogo
                  showName={false}
                  imageClassName="h-6"
                  className="shrink-0"
                />
                A new era of personal movement
              </div>

              <h1 className="font-display max-w-3xl text-5xl leading-[0.95] font-semibold tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
                Move better.
                <br />
                Progress smarter.
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-white/72 sm:text-xl">
                A personalized workout plan that adapts to your level, evolves
                with your progress, and keeps you moving toward a real goal
                without guesswork.
              </p>

              <div className="mt-9 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#final-cta"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#05070b] transition hover:bg-[#dbe7ff]"
                >
                  Build My Plan
                  <ArrowIcon />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/14 bg-white/5 px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  See How It Works
                </a>
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Training style", value: "Adaptive bodyweight" },
                  { label: "Built for", value: "Home or outdoors" },
                  { label: "Session flow", value: "Structured progress" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/10 bg-white/6 px-5 py-5"
                  >
                    <p className="text-xs tracking-[0.22em] text-white/48 uppercase">
                      {item.label}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative lg:pl-8">
              <div className="blue-orb absolute -left-8 top-12 h-40 w-40 rounded-full bg-[#125bff]/30 blur-3xl" />
              <div className="blue-orb absolute right-0 top-0 h-32 w-32 rounded-full bg-[#125bff]/28 blur-3xl" />

              <div className="float-card relative mx-auto max-w-[34rem] rounded-[2rem] border border-white/12 bg-[linear-gradient(180deg,_rgba(10,13,19,0.98),_rgba(6,9,13,0.92))] p-5 shadow-[0_32px_120px_rgba(5,7,11,0.72)]">
                <div className="rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <BrandLogo showName={false} imageClassName="h-9" />
                      <div>
                        <p className="text-xs tracking-[0.22em] text-white/48 uppercase">
                          Today&apos;s adaptive plan
                        </p>
                        <p className="mt-1 text-base font-semibold text-white">
                          Pull strength and core control
                        </p>
                      </div>
                    </div>
                    <div className="rounded-full border border-[#125bff]/40 bg-[#125bff]/14 px-3 py-1 text-xs font-semibold text-[#9fbeff]">
                      Live progression
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-white/8 bg-[#0b111a] p-5">
                    <div className="grid gap-5 sm:grid-cols-[1.08fr_0.92fr]">
                      <div className="space-y-4">
                        {[
                          {
                            phase: "Warm-up",
                            title: "Scapular prep + hanging activation",
                            time: "08 min",
                          },
                          {
                            phase: "Main block",
                            title: "Assisted pull-up ladder",
                            time: "18 min",
                          },
                          {
                            phase: "Support work",
                            title: "Hollow body and ring rows",
                            time: "12 min",
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
                            Weekly signal
                          </p>
                          <div className="mt-4 flex items-end justify-between">
                            {["M", "T", "W", "T", "F", "S"].map((day, index) => (
                              <div
                                key={day + index}
                                className="flex flex-col items-center gap-2"
                              >
                                <div
                                  className={`w-7 rounded-full ${
                                    index === 2
                                      ? "h-28 bg-[#125bff]"
                                      : index === 4
                                        ? "h-20 bg-white/24"
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
                                Level path
                              </p>
                              <p className="mt-2 text-sm font-semibold text-white">
                                Ring row to full pull-up
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
                            Adaptive note
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            Grip fatigue detected last session.
                          </p>
                          <p className="mt-2 text-sm leading-6 text-white/70">
                            Kinova lowers today&apos;s volume slightly and keeps
                            your progression moving instead of forcing a miss.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="float-badge absolute -left-5 top-16 rounded-3xl border border-white/12 bg-white/92 px-4 py-4 text-[#05070b] shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
                  <p className="text-[0.68rem] font-semibold tracking-[0.24em] text-[#125bff] uppercase">
                    Adjustment made
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    Easier progression step unlocked
                  </p>
                  <p className="mt-1 max-w-[12rem] text-sm leading-6 text-[#475164]">
                    Smart progression keeps the session productive instead of
                    overwhelming.
                  </p>
                </div>

                <div className="float-badge absolute -bottom-6 right-6 rounded-3xl border border-white/10 bg-[#0b111a] px-5 py-4 shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
                  <p className="text-[0.68rem] tracking-[0.24em] text-white/45 uppercase">
                    Momentum
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white">
                    4 strong weeks in a row
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#125bff]" />
                    <span className="text-sm text-white/70">
                      Ready for the next level
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white text-[#05070b]">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-28">
          <SectionHeading
            eyebrow="How It Works"
            title="A plan that starts with you and keeps learning from your progress."
            description="Kinova is built to remove friction. You begin with the level that fits now, then your plan keeps adjusting so progress feels clear, structured, and sustainable."
          />

          <div className="mt-14 grid gap-5 lg:grid-cols-4">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-[2rem] border border-[#dbe4f2] bg-[#f7faff] p-6 shadow-[0_24px_70px_rgba(18,91,255,0.06)]"
              >
                <p className="text-xs font-semibold tracking-[0.28em] text-[#125bff] uppercase">
                  {step.number}
                </p>
                <h3 className="mt-5 font-display text-2xl leading-tight font-semibold tracking-[-0.04em]">
                  {step.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#526072]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="bg-[#eef4ff] text-[#05070b]">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <SectionHeading
              eyebrow="Key Benefits"
              title="Less guesswork. More structure. Better long-term progress."
              description="Kinova helps you train with more clarity and less wasted effort, whether you are starting out, restarting, or building toward your next milestone."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="rounded-[1.75rem] border border-white bg-white p-5 shadow-[0_24px_70px_rgba(18,91,255,0.08)]"
                >
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#125bff] text-white">
                    <ArrowIcon />
                  </div>
                  <p className="text-base leading-7 text-[#243041]">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-[#05070b]">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <SectionHeading
              eyebrow="Why Kinova Is Different"
              title="The plan evolves with the user."
              description="Generic workout apps often hand you content and leave the hard part to you. Kinova is built around ongoing fit, realistic progression, and training that stays usable over time."
            />

            <div className="overflow-hidden rounded-[2rem] border border-[#d9e3f3]">
              <div className="grid grid-cols-2 bg-[#08111f] text-white">
                <div className="border-r border-white/8 px-6 py-5">
                  <p className="text-xs tracking-[0.26em] text-white/45 uppercase">
                    Generic plans
                  </p>
                </div>
                <div className="bg-[linear-gradient(180deg,_rgba(18,91,255,0.18),_rgba(18,91,255,0.08))] px-6 py-5">
                  <p className="text-xs tracking-[0.26em] text-[#9fbeff] uppercase">
                    Kinova
                  </p>
                </div>
              </div>

              {comparisonRows.map((row) => (
                <div
                  key={row.generic}
                  className="grid grid-cols-1 border-t border-[#d9e3f3] bg-white sm:grid-cols-2"
                >
                  <div className="border-b border-[#d9e3f3] px-6 py-5 text-base leading-7 text-[#667180] sm:border-b-0 sm:border-r">
                    {row.generic}
                  </div>
                  <div className="px-6 py-5 text-base leading-7 text-[#132133]">
                    {row.kinova}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#05070b] text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="Who It Is For"
            title="Built for normal people who want a smarter path to progress."
            description="Kinova is designed for people who want training that meets them where they are, works with real conditions, and keeps pointing toward the next meaningful step."
            inverse
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {audience.map((item) => (
              <article
                key={item.title}
                className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6"
              >
                <p className="text-xs tracking-[0.24em] text-[#8ab4ff] uppercase">
                  For
                </p>
                <h3 className="mt-4 font-display text-2xl font-semibold tracking-[-0.04em] text-white">
                  {item.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-white/68">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="progression" className="bg-[linear-gradient(180deg,_#09111d,_#0b1626)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12 lg:py-30">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.94fr)_minmax(0,1.06fr)]">
            <div className="max-w-2xl">
              <SectionHeading
                eyebrow="Adaptive Progression"
                title="Progress is not linear. Smart coaching should not pretend it is."
                description="Kinova treats progression like a living route. When you improve, the plan rises with you. When you struggle, the route changes so you can keep moving instead of getting stuck."
                inverse
              />

              <div className="mt-8 space-y-4 text-base leading-8 text-white/72">
                <p>
                  Stepping back is not failure. It is part of training
                  intelligently. Kinova makes room for that reality and keeps the
                  path forward visible.
                </p>
                <p>
                  The result is better consistency, better fit, and a stronger
                  sense that your plan is working with you instead of against you.
                </p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute left-8 top-12 hidden h-[76%] w-px bg-[linear-gradient(180deg,_rgba(18,91,255,0.15),_rgba(18,91,255,0.85),_rgba(255,255,255,0.12))] lg:block" />
              <div className="space-y-6">
                {progressionStates.map((item, index) => (
                  <article
                    key={item.title}
                    className="relative rounded-[2rem] border border-white/10 bg-white/[0.05] p-6 pl-8 lg:pl-14"
                  >
                    <div className="absolute left-5 top-8 flex h-7 w-7 items-center justify-center rounded-full border border-[#125bff]/50 bg-[#125bff] text-xs font-semibold text-white lg:left-[-13px]">
                      {index + 1}
                    </div>
                    <h3 className="font-display text-2xl font-semibold tracking-[-0.04em]">
                      {item.title}
                    </h3>
                    <p className="mt-4 max-w-xl text-base leading-7 text-white/70">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white text-[#05070b]">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center">
            <SectionHeading
              eyebrow="Results Over Time"
              title="A better plan changes how training feels week after week."
              description="Kinova is built to help you stay in motion. When the plan fits better, consistency improves. When consistency improves, results stop feeling random."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {outcomes.map((item, index) => (
                <div
                  key={item}
                  className="rounded-[1.75rem] border border-[#dbe4f2] bg-[#f8fbff] p-5"
                >
                  <p className="text-xs tracking-[0.24em] text-[#125bff] uppercase">
                    0{index + 1}
                  </p>
                  <p className="mt-4 text-base leading-7 text-[#223041]">
                    {item}
                  </p>
                </div>
              ))}

              <div className="rounded-[1.75rem] bg-[#08111f] p-6 text-white shadow-[0_30px_90px_rgba(5,7,11,0.2)] sm:col-span-2">
                <p className="text-xs tracking-[0.26em] text-[#8ab4ff] uppercase">
                  Outcome
                </p>
                <p className="mt-4 font-display text-3xl leading-tight font-semibold tracking-[-0.04em] sm:text-4xl">
                  Train with more confidence because the plan actually fits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#05070b] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(18,91,255,0.15),_transparent_48%)]" />
        <div className="mx-auto max-w-5xl px-6 py-24 text-center sm:px-8 lg:py-28">
          <BrandLogo
            className="justify-center"
            imageClassName="h-14 sm:h-16"
            titleClassName="text-lg sm:text-xl"
            subtitle="Kinetic Nova"
            subtitleClassName="text-white/45"
          />
          <p className="mt-8 text-xs tracking-[0.3em] text-[#8ab4ff] uppercase">
            Brand Statement
          </p>
          <h2 className="mx-auto mt-6 max-w-4xl font-display text-4xl leading-tight font-semibold tracking-[-0.05em] sm:text-5xl lg:text-6xl">
            Kinova = Kinetic Nova
            <br />
            A new era of personal movement.
          </h2>
          <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
            Movement, structure, adaptive progress, and intelligent training
            come together in a system designed to help normal people move
            forward with more clarity and more belief in the plan.
          </p>
        </div>
      </section>

      <section id="faq" className="bg-white text-[#05070b]">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
          <SectionHeading
            eyebrow="FAQ"
            title="Practical answers for getting started."
            description="Kinova is built to feel clear from the first session. These are the questions most people ask before starting."
          />

          <div className="mt-14 grid gap-4">
            {faqs.map((item) => (
              <details
                key={item.question}
                className="group rounded-[1.75rem] border border-[#dbe4f2] bg-[#f8fbff] px-6 py-5 open:bg-white"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-xl font-semibold tracking-[-0.03em]">
                  {item.question}
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d9e3f3] text-[#125bff] transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-4 max-w-3xl pr-10 text-base leading-8 text-[#556274]">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="final-cta" className="bg-[linear-gradient(180deg,_#09111d,_#05070b)] text-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(135deg,_rgba(18,91,255,0.26),_rgba(255,255,255,0.04)_38%,_rgba(255,255,255,0.02)_100%)] px-6 py-12 shadow-[0_40px_120px_rgba(5,7,11,0.55)] sm:px-10 lg:px-14 lg:py-16">
            <div className="absolute right-0 top-0 h-44 w-44 rounded-full bg-[#125bff]/28 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div className="max-w-3xl">
                <p className="text-xs tracking-[0.3em] text-[#8ab4ff] uppercase">
                  Final CTA
                </p>
                <h2 className="mt-5 font-display text-4xl leading-tight font-semibold tracking-[-0.05em] sm:text-5xl">
                  Your next level starts here.
                </h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                  Start with a personalized plan that adapts to your level,
                  guides your progress, and helps you keep moving with purpose.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                <a
                  href="#"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#05070b] transition hover:bg-[#dbe7ff]"
                >
                  Start Personalized Plan
                  <ArrowIcon />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.06] px-6 py-4 text-sm font-semibold text-white transition hover:bg-white/[0.1]"
                >
                  Explore the Flow
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/8 bg-[#05070b] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:px-12">
          <div className="max-w-md">
            <BrandLogo
              subtitle="Personal training that adapts"
              imageClassName="h-11"
            />
            <p className="mt-5 text-base leading-7 text-white/65">
              Kinova helps you start at your real level, train with structure,
              and progress through a plan that keeps evolving with you.
            </p>
          </div>

          <div>
            <p className="text-xs tracking-[0.24em] text-white/42 uppercase">
              Navigation
            </p>
            <div className="mt-5 flex flex-col gap-3">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-white/68 transition hover:text-white"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs tracking-[0.24em] text-white/42 uppercase">
              Brand
            </p>
            <div className="mt-5 flex flex-col gap-3 text-sm text-white/68">
              <span>Move better. Progress smarter.</span>
              <span>Your next level starts here.</span>
              <span>Privacy</span>
              <span>Terms</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
