import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Tell us where you're starting",
    description:
      "Share your goal, current level, available equipment, training style, and how much time you have.",
  },
  {
    number: "02",
    title: "Get a plan built around you",
    description:
      "Start with workouts that match your real level instead of guessing where to begin.",
  },
  {
    number: "03",
    title: "Train and log what happened",
    description:
      "Complete sessions, track your progress, and show the app what feels good, challenging, or too much.",
  },
  {
    number: "04",
    title: "Let the plan keep adapting",
    description:
      "As you improve, the app adjusts your training so you keep moving toward your goal step by step.",
  },
];

const highlights = [
  {
    title: "Built around your real setup",
    description: "Home, park, bodyweight, or minimal equipment all fit into the same system.",
  },
  {
    title: "Adjusts when life changes",
    description: "The plan stays useful when energy, schedule, or current ability shifts.",
  },
  {
    title: "Keeps the next step obvious",
    description: "You do not have to piece together random workouts or guess what comes next.",
  },
];

const comparisonPoints = {
  generic: [
    "Start too hard or too easy for many people",
    "Leave you guessing what to do next",
    "Do not respond when you stall or fall behind",
    "Make consistency harder because the plan does not fit your reality",
  ],
  adaptive: [
    "Starts from your current level and goal",
    "Changes as you complete workouts and improve",
    "Adjusts when a movement is not there yet",
    "Keeps your progress structured, realistic, and easier to sustain",
  ],
};

const audience = [
  {
    title: "Beginners",
    description:
      "If you do not know where to start, the app gives you a realistic first step instead of an overwhelming plan.",
  },
  {
    title: "People coming back",
    description:
      "Returning after a break feels easier when the plan meets your current level rather than your past one.",
  },
  {
    title: "Home and outdoor trainers",
    description:
      "Use it for bodyweight sessions, park workouts, minimal equipment routines, or flexible training on the go.",
  },
  {
    title: "People who want structure",
    description:
      "Follow a clear path without paying for a coach or figuring out every next step alone.",
  },
];

const benefits = [
  {
    title: "A starting point that fits",
    description:
      "Your plan begins at a level you can actually handle, so progress feels possible from day one.",
  },
  {
    title: "Difficulty that adjusts",
    description:
      "When you are ready, the challenge grows. When something is too hard, the plan changes with you.",
  },
  {
    title: "Clear next steps",
    description:
      "You always know what to do next instead of bouncing between random workouts and hoping for results.",
  },
  {
    title: "Progress you can sustain",
    description:
      "The goal is not to crush one session. It is to keep building week after week without burning out.",
  },
  {
    title: "Flexible for real life",
    description:
      "Short sessions, busy weeks, and changing conditions do not have to break your routine.",
  },
  {
    title: "Training with purpose",
    description:
      "Every workout supports a goal, whether you want strength, fitness, consistency, or a specific milestone.",
  },
];

const outcomes = [
  "Get stronger with a path that builds over time.",
  "Train more consistently because the plan stays realistic.",
  "Improve fitness without feeling lost between sessions.",
  "Work toward a goal with a routine you can actually stick to.",
];

const faqs = [
  {
    question: "Is this app suitable for beginners?",
    answer:
      "Yes. It is built to start from your real level, including if you are brand new to training and need more guidance.",
  },
  {
    question: "What if I cannot do some exercises yet?",
    answer:
      "The plan adjusts. If a movement is too difficult, the app gives you a more suitable step so you can keep progressing instead of getting stuck.",
  },
  {
    question: "Do I need gym equipment?",
    answer:
      "No. The app can support bodyweight training, outdoor workouts, and routines built around minimal equipment.",
  },
  {
    question: "Can I use it at home or outdoors?",
    answer:
      "Yes. It is designed for self-guided training in the places people actually work out, including at home, outside, or anywhere with limited space.",
  },
  {
    question: "What if I only have a short amount of time?",
    answer:
      "You can build your plan around the time you have. The goal is to make training easier to fit into real life, not harder.",
  },
  {
    question: "How is this different from other workout apps?",
    answer:
      "Most apps give you a fixed program or a large library. This app gives you a plan that keeps changing with your level, progress, and training reality.",
  },
];

export default function Home() {
  return (
    <div className="landing-page pb-24">
      <section className="mx-auto w-full max-w-6xl px-6 pb-6 pt-8 sm:pt-12 lg:pb-8 lg:pt-16">
        <div className="section-shell section-shell-hero p-7 sm:p-10 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.06fr)_30rem] lg:items-center">
            <div className="min-w-0 space-y-8">
              <div className="inline-flex w-fit items-center gap-3 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-text-secondary">
                <span className="pill pill-accent px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Personalized training
                </span>
                <span>Start at your level. Keep progressing at your pace.</span>
              </div>

              <div className="space-y-5">
                <h1 className="max-w-3xl text-5xl font-semibold leading-none tracking-[-0.07em] text-text-primary sm:text-6xl lg:text-7xl">
                  Your workout plan should feel cohesive, not random.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-text-secondary sm:text-xl">
                  Build a personalized program based on your goal, fitness level,
                  preferences, and training conditions. As you improve, your plan evolves.
                  If something feels too difficult, it adjusts so you can keep moving
                  forward without losing momentum.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/sign-up"
                  className="inline-flex h-13 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-[#0a130f] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#e4ff92]"
                >
                  Build my plan
                </Link>
                <Link
                  href="/#how-it-works"
                  className="inline-flex h-13 items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 text-sm font-semibold text-text-primary transition-colors hover:bg-white/10"
                >
                  See how it works
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <article key={item.title} className="metric-card rounded-[1.5rem] p-4">
                    <h2 className="text-sm font-semibold leading-6 text-text-primary">
                      {item.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="min-w-0">
              <div className="preview-panel rounded-[2rem] p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(212,255,99,0.2),rgba(212,255,99,0.06))] p-5">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e6f6b7]">
                      Goal
                    </p>
                    <p className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-text-primary">
                      First pull-up
                    </p>
                    <p className="mt-2 max-w-xs text-sm leading-6 text-[#d2ddcf]">
                      Start with a plan that builds strength, control, and confidence
                      without skipping steps.
                    </p>
                  </div>
                  <span className="rounded-full border border-[#d4ff63]/30 bg-[#d4ff63]/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#ebf8c4]">
                    Week 1
                  </span>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[1.6rem] border border-white/8 bg-black/18 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">This week</p>
                        <p className="mt-1 text-sm text-text-secondary">
                          A clear path instead of random sessions
                        </p>
                      </div>
                      <span className="pill pill-secondary px-3 py-1 text-xs font-semibold">
                        3 workouts
                      </span>
                    </div>

                    <div className="mt-5 space-y-3">
                      {[
                        ["Push strength", "25 min", "Ready"],
                        ["Pull foundation", "30 min", "Today"],
                        ["Core and mobility", "20 min", "Next"],
                      ].map(([title, time, status]) => (
                        <div
                          key={title}
                          className="rounded-[1.25rem] border border-white/8 bg-white/[0.04] px-4 py-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-text-primary">{title}</p>
                              <p className="text-xs text-text-secondary">{time}</p>
                            </div>
                            <span className="pill px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                              {status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <article className="info-card rounded-[1.5rem] p-5">
                      <p className="text-sm font-semibold text-text-primary">Today&apos;s shift</p>
                      <p className="mt-3 text-sm leading-6 text-text-secondary">
                        Ring rows felt strong last session, so the next workout adds a harder
                        angle and a little more volume.
                      </p>
                    </article>

                    <article className="info-card rounded-[1.5rem] p-5">
                      <p className="text-sm font-semibold text-text-primary">
                        If it feels too hard
                      </p>
                      <p className="mt-3 text-sm leading-6 text-text-secondary">
                        The plan steps back to a more suitable variation so progress keeps
                        going instead of stopping.
                      </p>
                    </article>

                    <article className="info-card rounded-[1.5rem] p-5">
                      <p className="text-sm font-semibold text-text-primary">
                        Training inputs
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-text-primary">
                        {["Goal", "Level", "Schedule", "Equipment", "Style"].map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-2"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="section-shell p-7 sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <div className="space-y-5">
              <p className="pill inline-flex w-fit px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                How it works
              </p>
              <h2 className="max-w-lg text-3xl font-semibold tracking-[-0.05em] text-text-primary sm:text-4xl">
                A guided training path in four connected steps.
              </h2>
              <p className="max-w-xl text-base leading-7 text-text-secondary">
                The flow stays simple: understand your starting point, build the right plan,
                keep training, and let the next step change with your progress instead of
                staying fixed.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {steps.map((step) => (
                <article key={step.number} className="timeline-card rounded-[1.7rem] p-6">
                  <div className="flex items-center gap-4">
                    <span className="timeline-number">{step.number}</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-[#d4ff63]/25 to-transparent" />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-text-primary">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-text-secondary">
                    {step.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="comparison" className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="section-shell section-shell-muted p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr]">
            <div className="space-y-5">
              <p className="pill inline-flex w-fit px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                Why this is different
              </p>
              <h2 className="max-w-lg text-3xl font-semibold tracking-[-0.05em] text-text-primary sm:text-4xl">
                Generic plans feel disconnected because they ignore your reality.
              </h2>
              <p className="max-w-xl text-base leading-7 text-text-secondary">
                Some plans are too hard, some are too random, and most do not know what to
                do when your progress changes. A better product feels structured from the
                first session and stays coherent as you go.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <article className="comparison-card rounded-[1.8rem] p-6">
                <p className="text-lg font-semibold text-text-primary">One-size-fits-all plans</p>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-text-secondary">
                  {comparisonPoints.generic.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>

              <article className="comparison-card comparison-card-accent rounded-[1.8rem] p-6">
                <p className="text-lg font-semibold text-text-primary">An adaptive personal plan</p>
                <ul className="mt-5 space-y-3 text-sm leading-7 text-[#deeadf]">
                  {comparisonPoints.adaptive.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
          </div>

          <div id="benefits" className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {benefits.map((benefit) => (
              <article key={benefit.title} className="info-card rounded-[1.6rem] p-5">
                <h3 className="text-xl font-semibold text-text-primary">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="adaptive" className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="section-shell p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="pill pill-secondary inline-flex w-fit px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                Who it is for
              </p>
              <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.05em] text-text-primary sm:text-4xl">
                Built for people who want guidance without pressure.
              </h2>
              <div id="for-you" className="mt-6 grid gap-4 sm:grid-cols-2">
                {audience.map((item) => (
                  <article key={item.title} className="metric-card rounded-[1.55rem] p-5">
                    <h3 className="text-xl font-semibold text-text-primary">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-text-secondary">
                      {item.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <article className="story-card story-card-accent rounded-[1.8rem] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#e7f7bc]">
                  Adaptive progression
                </p>
                <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-text-primary">
                  Progress forward, even when the path needs to change.
                </h3>
                <p className="mt-4 text-base leading-7 text-[#dce7d8]">
                  Smart training is not about forcing the next hard step before you are
                  ready. It is about giving you the right challenge at the right time, then
                  adjusting when your body, schedule, or current ability says something needs
                  to change.
                </p>
              </article>

              <div className="grid gap-4 md:grid-cols-2">
                <article className="story-card rounded-[1.65rem] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#b8f6e8]">
                    When you are ready
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold text-text-primary">
                    The challenge grows with you.
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">
                    More reps, harder variations, tighter rest, or stronger progressions are
                    introduced gradually when your training shows you can handle them.
                  </p>
                </article>

                <article className="story-card rounded-[1.65rem] p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d9ec95]">
                    When something is too difficult
                  </p>
                  <h3 className="mt-4 text-2xl font-semibold text-text-primary">
                    The app changes the step, not the goal.
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-text-secondary">
                    You may get a simpler variation, a smaller progression, or a lower volume
                    so you can keep building capacity instead of feeling stuck.
                  </p>
                </article>
              </div>

              <article className="info-card rounded-[1.65rem] p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-text-tertiary">
                  Why it matters
                </p>
                <p className="mt-3 text-lg leading-8 text-text-primary">
                  You keep momentum without pretending every day feels the same.
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="results" className="mx-auto w-full max-w-6xl px-6 py-6">
        <div className="section-shell section-shell-muted p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="pill inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                Real outcomes
              </p>
              <h2 className="mt-5 max-w-xl text-3xl font-semibold tracking-[-0.05em] text-text-primary sm:text-4xl">
                Train toward results, not just completed workouts.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-text-secondary">
                The point is not to stay busy. It is to build strength, consistency, fitness,
                and confidence with a plan you can keep following long enough to see change.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {outcomes.map((item) => (
                <article key={item} className="metric-card rounded-[1.5rem] p-5">
                  <p className="text-base font-medium leading-7 text-text-primary">{item}</p>
                </article>
              ))}
            </div>
          </div>

          <div id="faq" className="mt-8 grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <div className="space-y-4">
              <p className="pill pill-secondary inline-flex w-fit px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                FAQ
              </p>
              <h2 className="max-w-lg text-3xl font-semibold tracking-[-0.05em] text-text-primary sm:text-4xl">
                Practical answers before you start.
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((item) => (
                <details key={item.question} className="faq-card group rounded-[1.55rem] p-6">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-text-primary">
                    <span>{item.question}</span>
                    <span className="text-2xl leading-none text-text-secondary transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-text-secondary">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-[2rem] border border-[#d4ff63]/16 bg-[linear-gradient(135deg,rgba(212,255,99,0.14),rgba(124,233,207,0.05)_45%,rgba(255,255,255,0.02))] p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="pill pill-accent inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                  Start now
                </p>
                <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.05em] text-text-primary sm:text-4xl">
                  Start at your level and build toward your goal with a plan that adapts to
                  you.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
                  Get a personalized workout program you can follow at home, outdoors, or
                  wherever you train best.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href="/sign-up"
                  className="inline-flex h-13 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-[#0a130f] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#e4ff92]"
                >
                  Get my personalized plan
                </Link>
                <Link
                  href="/onboarding"
                  className="inline-flex h-13 items-center justify-center rounded-full border border-white/12 bg-white/6 px-6 text-sm font-semibold text-text-primary transition-colors hover:bg-white/10"
                >
                  Preview the plan flow
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
