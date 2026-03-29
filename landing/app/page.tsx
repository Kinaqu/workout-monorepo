import { BrandLogo } from "@/components/brand-logo";
import { HeroVisual } from "@/components/hero-visual";
import { SectionHeading } from "@/components/section-heading";

const navItems = [
  { label: "How It Works", href: "#how-it-works" },
  { label: "Benefits", href: "#benefits" },
  { label: "Progression", href: "#progression" },
  { label: "FAQ", href: "#faq" },
];

const steps = [
  {
    number: "01",
    title: "Tell Kinova where you are",
    description:
      "Set your goal, training style, schedule, and current level so the starting point feels realistic from day one.",
  },
  {
    number: "02",
    title: "Get a personalized plan",
    description:
      "Receive sessions structured around your time, environment, and ability instead of a generic routine built for someone else.",
  },
  {
    number: "03",
    title: "Train and track the work",
    description:
      "Move through guided sessions, see what to do next, and build momentum with a plan that stays clear and easy to follow.",
  },
  {
    number: "04",
    title: "Let the plan evolve",
    description:
      "When progress is strong, Kinova pushes forward. When something is not clicking yet, it adjusts the route without losing direction.",
  },
];

const differences = {
  generic: [
    "One plan pushed to everyone",
    "Sessions that jump around without progression",
    "Difficulty that is often too hard or too easy",
    "More guesswork, less consistency",
  ],
  kinova: [
    "A plan shaped around your real starting point",
    "Structured progress that builds over time",
    "Adaptive difficulty that responds to your performance",
    "A clearer path you can actually stick with",
  ],
};

const audience = [
  {
    title: "Beginners",
    description:
      "Start with guidance that feels approachable, not intimidating.",
  },
  {
    title: "Returning trainees",
    description:
      "Build back into training with structure instead of overdoing week one.",
  },
  {
    title: "Home workout users",
    description:
      "Get sessions that fit limited space, simple setups, and real life.",
  },
  {
    title: "Outdoor and bodyweight users",
    description:
      "Train with progressions designed for movement, control, and strength.",
  },
  {
    title: "People who want structure",
    description:
      "Know what to do today, what comes next, and why it matters.",
  },
  {
    title: "People chasing real progress",
    description:
      "Follow a sustainable path toward stronger movement and better habits.",
  },
];

const benefits = [
  {
    title: "Start at your level",
    description:
      "Kinova meets you where you are instead of expecting you to keep up with an unrealistic plan.",
  },
  {
    title: "Adaptive difficulty",
    description:
      "As your capacity changes, the program adjusts so you keep progressing at the right pace.",
  },
  {
    title: "Less guesswork",
    description:
      "You do not need to wonder what comes next or whether today should be harder.",
  },
  {
    title: "More consistency",
    description:
      "A plan that fits your reality is easier to repeat, and repetition is what creates progress.",
  },
  {
    title: "Flexible training",
    description:
      "Train at home, outdoors, or wherever your routine actually happens.",
  },
  {
    title: "A clearer path to results",
    description:
      "Every step connects to the next so improvement feels deliberate rather than random.",
  },
];

const progressionPoints = [
  {
    title: "Progress when you are ready",
    description:
      "When movement quality and consistency are strong, Kinova increases the challenge with the next logical step.",
  },
  {
    title: "Adjust when something is not landing",
    description:
      "If an exercise is still too advanced, the plan shifts to a better progression instead of leaving you stuck.",
  },
  {
    title: "Keep the direction, not the pressure",
    description:
      "Stepping back is treated as smart coaching, not failure. The goal is forward motion you can sustain.",
  },
];

const outcomes = [
  "Build consistency you can maintain week after week",
  "Improve movement quality and body control",
  "Get stronger with a plan that actually fits your life",
  "Train with more confidence and less second-guessing",
  "See meaningful progress without chasing extremes",
  "Move toward real goals with clearer structure",
];

const faqs = [
  {
    question: "Is Kinova good for beginners?",
    answer:
      "Yes. Kinova is designed to start from your real level, so beginners get guidance that feels approachable and structured instead of overwhelming.",
  },
  {
    question: "What if I cannot do some exercises yet?",
    answer:
      "That is exactly where adaptive progression matters. Kinova gives you a more suitable step so you can keep building toward the movement instead of stopping.",
  },
  {
    question: "Can I train at home or outdoors?",
    answer:
      "Yes. The product is built for flexible training conditions, including home, outdoor, and bodyweight-focused routines.",
  },
  {
    question: "Do I need equipment?",
    answer:
      "Not necessarily. Kinova can support equipment-light routines and bodyweight-based progressions, depending on your setup and preferences.",
  },
  {
    question: "What if I only have limited time?",
    answer:
      "Your available schedule is part of the plan. Kinova helps shape sessions that work inside the time you actually have.",
  },
  {
    question: "How is this different from other workout apps?",
    answer:
      "Most workout apps give you content. Kinova gives you a plan that evolves with your progress, adjusts when needed, and keeps your training structured over time.",
  },
];

export default function Home() {
  return (
    <main id="top" className="overflow-x-hidden">
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[42rem] bg-[linear-gradient(180deg,rgba(47,107,255,0.18),rgba(5,7,13,0))]" />

        <div className="relative mx-auto max-w-[1240px] px-6 pb-[4.5rem] pt-6 sm:px-8 lg:px-10">
          <header className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] px-4 py-4 backdrop-blur-md sm:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <BrandLogo priority size={28} subtitle="Kinetic Nova" />
              <a
                href="#final-cta"
                className="inline-flex items-center justify-center rounded-full border border-[color:rgba(120,167,255,0.3)] bg-[color:rgba(47,107,255,0.16)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[color:rgba(47,107,255,0.24)]"
              >
                Start your plan
              </a>
            </div>

            <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-4 text-sm text-white/68 sm:justify-end sm:text-[0.95rem]">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="transition hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </header>

          <div className="grid gap-14 pb-20 pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(480px,560px)] lg:items-center lg:gap-12 lg:pt-[4.5rem]">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white/72">
                <BrandLogo showWordmark={false} size={16} />
                Adaptive workout app
              </div>

              <h1 className="font-display text-balance mt-7 text-5xl font-semibold tracking-[-0.08em] text-white sm:text-6xl lg:text-[5.3rem] lg:leading-[0.96]">
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
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-[color:var(--kinova-blue)] px-7 text-base font-semibold text-white shadow-[0_18px_45px_rgba(15,55,189,0.38)] transition hover:bg-[color:#4e81ff]"
                >
                  Build my plan
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] px-7 text-base font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  See how it works
                </a>
              </div>

              <div className="mt-10 grid gap-4 border-t border-white/10 pt-8 sm:grid-cols-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/45">
                    Core promise
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">
                    The plan evolves with you
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/45">
                    Best for
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">
                    Home, outdoor, and bodyweight training
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.28em] text-white/45">
                    Built for
                  </div>
                  <div className="mt-2 text-base font-semibold text-white">
                    Sustainable progress, not random sessions
                  </div>
                </div>
              </div>
            </div>

            <HeroVisual />
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-[color:var(--kinova-white)] text-[color:var(--kinova-black)]">
        <div className="mx-auto max-w-[1240px] px-6 py-[5.5rem] sm:px-8 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="How It Works"
            title="Personal training that adapts from the start."
            description="Kinova is built around one simple idea: your plan should reflect your real level, then keep evolving as you improve."
          />

          <div className="mt-12 grid gap-5 lg:grid-cols-4">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-[1.75rem] border border-black/8 bg-white px-5 py-6 shadow-[0_18px_50px_rgba(8,15,28,0.06)]"
              >
                <div className="text-sm font-semibold uppercase tracking-[0.28em] text-[color:var(--kinova-blue)]">
                  {step.number}
                </div>
                <h3 className="font-display mt-6 text-2xl font-semibold tracking-[-0.05em] text-black">
                  {step.title}
                </h3>
                <p className="mt-4 text-[0.98rem] leading-7 text-black/68">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[color:rgba(5,7,13,0.96)]">
        <div className="mx-auto max-w-[1240px] px-6 py-[5.5rem] sm:px-8 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="Why Kinova"
            title="Structured like coaching, not a content dump."
            description="Most workout apps give you volume. Kinova gives you direction. It keeps training realistic, progressive, and easier to stay with over time."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <article className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 lg:p-8">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/46">
                Generic plans
              </div>
              <h3 className="font-display mt-5 text-3xl font-semibold tracking-[-0.05em] text-white">
                Same workout. Same assumptions.
              </h3>
              <div className="mt-8 space-y-3">
                {differences.generic.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.25rem] border border-white/10 bg-black/18 px-4 py-3.5 text-sm leading-7 text-white/68"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[2rem] border border-[color:rgba(120,167,255,0.28)] bg-[linear-gradient(180deg,rgba(47,107,255,0.16),rgba(10,17,30,0.92))] p-6 lg:p-8">
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-white/54">
                Kinova
              </div>
              <h3 className="font-display mt-5 text-3xl font-semibold tracking-[-0.05em] text-white">
                Personalized. Adaptive. Built to last.
              </h3>
              <div className="mt-8 space-y-3">
                {differences.kinova.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.25rem] border border-white/12 bg-white/[0.06] px-4 py-3.5 text-sm leading-7 text-white/84"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--kinova-white)] text-[color:var(--kinova-black)]">
        <div className="mx-auto max-w-[1240px] px-6 py-[5.5rem] sm:px-8 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="Who It Is For"
            title="Built for people who want guided progress without the noise."
            description="Kinova is designed for normal users who want a better training path, whether they are just starting or rebuilding momentum."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {audience.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.7rem] border border-black/8 bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(243,246,252,1))] p-6"
              >
                <div className="h-12 w-12 rounded-[1rem] bg-[linear-gradient(180deg,#2f6bff,#0f37bd)]" />
                <h3 className="font-display mt-6 text-2xl font-semibold tracking-[-0.05em] text-black">
                  {item.title}
                </h3>
                <p className="mt-4 text-[0.98rem] leading-7 text-black/70">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="benefits" className="border-y border-white/8 bg-[color:rgba(5,7,13,0.96)]">
        <div className="mx-auto max-w-[1240px] px-6 py-[5.5rem] sm:px-8 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="Benefits"
            title="A sharper training experience from first session to next level."
            description="Everything about Kinova is designed to reduce friction, improve fit, and create clearer progress over time."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {benefits.map((benefit) => (
              <article
                key={benefit.title}
                className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-6"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--kinova-blue-soft)]">
                  Benefit
                </div>
                <h3 className="font-display mt-5 text-[1.7rem] font-semibold tracking-[-0.05em] text-white">
                  {benefit.title}
                </h3>
                <p className="mt-4 text-[0.98rem] leading-7 text-white/68">
                  {benefit.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="progression" className="bg-[color:var(--kinova-white)] text-[color:var(--kinova-black)]">
        <div className="mx-auto max-w-[1240px] px-6 py-[5.5rem] sm:px-8 lg:px-10 lg:py-28">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-center">
            <div>
              <SectionHeading
                eyebrow="Adaptive Progression"
                title="When you improve, the plan moves forward. When you struggle, it reroutes."
                description="This is the core Kinova promise. Progress should feel intelligent, not rigid. The app keeps your direction intact while matching the step to your current capacity."
              />

              <div className="mt-10 space-y-4">
                {progressionPoints.map((point) => (
                  <article
                    key={point.title}
                    className="rounded-[1.5rem] border border-black/8 bg-white px-5 py-5 shadow-[0_18px_50px_rgba(8,15,28,0.05)]"
                  >
                    <h3 className="font-display text-2xl font-semibold tracking-[-0.05em] text-black">
                      {point.title}
                    </h3>
                    <p className="mt-3 text-[0.98rem] leading-7 text-black/70">
                      {point.description}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2rem] border border-black/8 bg-[linear-gradient(180deg,#07101f,#0b1630)] p-6 text-white shadow-[0_30px_80px_rgba(9,17,31,0.18)] lg:p-8">
              <div className="bg-grid absolute inset-0 opacity-35" />
              <div className="relative flex items-center justify-between gap-4">
                <BrandLogo showWordmark={false} size={22} />
                <div className="rounded-full border border-white/12 bg-white/[0.06] px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/68">
                  Progression route
                </div>
              </div>

              <div className="relative mt-8 space-y-5">
                <div className="rounded-[1.55rem] border border-[color:rgba(120,167,255,0.28)] bg-[color:rgba(47,107,255,0.18)] p-5">
                  <div className="text-xs uppercase tracking-[0.24em] text-white/55">
                    Completed well
                  </div>
                  <div className="font-display mt-3 text-2xl font-semibold text-white">
                    Mobility prep + incline push-up
                  </div>
                  <p className="mt-3 text-sm leading-7 text-white/74">
                    Form stayed clean and recovery looked good, so tomorrow&apos;s
                    plan increases difficulty.
                  </p>
                </div>

                <div className="flex items-center justify-center">
                  <div className="h-16 w-px bg-[linear-gradient(180deg,rgba(134,182,255,0.2),rgba(134,182,255,0.9),rgba(134,182,255,0.2))]" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.05] p-5">
                    <div className="text-xs uppercase tracking-[0.24em] text-white/55">
                      Next step
                    </div>
                    <div className="font-display mt-3 text-2xl font-semibold text-white">
                      Standard push-up
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/70">
                      Kinova moves you up when the current step is clearly
                      solid.
                    </p>
                  </div>
                  <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.05] p-5">
                    <div className="text-xs uppercase tracking-[0.24em] text-white/55">
                      If needed
                    </div>
                    <div className="font-display mt-3 text-2xl font-semibold text-white">
                      Tempo incline reset
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/70">
                      If form drops, it adjusts the route instead of forcing the
                      jump.
                    </p>
                  </div>
                </div>

                <p className="rounded-[1.4rem] border border-white/10 bg-black/18 px-5 py-4 text-sm leading-7 text-white/72">
                  Stepping back is part of smart progression. The goal is not to
                  impress the app. The goal is to keep moving forward.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/8 bg-[color:rgba(5,7,13,0.96)]">
        <div className="mx-auto max-w-[1240px] px-6 py-[5.5rem] sm:px-8 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="Results"
            title="The outcome is not a harder workout. It is a better training trajectory."
            description="Kinova helps users build habits, confidence, and strength through a plan that feels more personal and more sustainable."
          />

          <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {outcomes.map((outcome) => (
              <article
                key={outcome}
                className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-6"
              >
                <div className="h-1.5 w-14 rounded-full bg-[linear-gradient(90deg,#2f6bff,#86b6ff)]" />
                <p className="mt-6 text-lg leading-8 text-white/82">{outcome}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[color:var(--kinova-white)] text-[color:var(--kinova-black)]">
        <div className="mx-auto max-w-[1240px] px-6 py-[5.5rem] sm:px-8 lg:px-10 lg:py-28">
          <div className="overflow-hidden rounded-[2.2rem] border border-black/8 bg-[linear-gradient(180deg,#0b1630,#102154)] px-6 py-12 text-white sm:px-8 lg:px-12 lg:py-16">
            <div className="mx-auto max-w-3xl text-center">
              <BrandLogo
                className="justify-center text-white"
                size={40}
                subtitle="Kinetic Nova"
                titleClassName="text-3xl sm:text-4xl"
              />
              <div className="mt-8 text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--kinova-blue-soft)]">
                Brand Statement
              </div>
              <h2 className="font-display text-balance mt-5 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">
                A new era of personal movement.
              </h2>
              <p className="mt-6 text-lg leading-8 text-white/74 sm:text-xl">
                Kinova combines motion, structure, and progression into a
                training experience that adapts around the person doing the
                work. Stronger habits. Better movement. Smarter progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="border-y border-white/8 bg-[color:rgba(5,7,13,0.96)]">
        <div className="mx-auto max-w-[1240px] px-6 py-[5.5rem] sm:px-8 lg:px-10 lg:py-28">
          <SectionHeading
            eyebrow="FAQ"
            title="Practical answers before you get started."
            description="Everything on the page points back to one goal: helping more people train with a plan that truly fits."
          />

          <div className="mt-12 grid gap-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-[1.55rem] border border-white/10 bg-white/[0.035] px-5 py-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left">
                  <span className="font-display text-2xl font-semibold tracking-[-0.05em] text-white">
                    {faq.question}
                  </span>
                  <span className="shrink-0 rounded-full border border-white/12 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/54 transition group-open:bg-[color:rgba(47,107,255,0.16)] group-open:text-white">
                    Open
                  </span>
                </summary>
                <p className="mt-4 max-w-4xl text-[0.98rem] leading-8 text-white/68">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section id="final-cta" className="bg-[color:var(--kinova-white)] text-[color:var(--kinova-black)]">
        <div className="mx-auto max-w-[1240px] px-6 py-[5.5rem] sm:px-8 lg:px-10 lg:py-28">
          <div className="overflow-hidden rounded-[2.2rem] border border-black/8 bg-[linear-gradient(180deg,#07101f,#102052)] px-6 py-12 text-white shadow-[0_30px_90px_rgba(7,16,31,0.18)] sm:px-8 lg:px-12 lg:py-16">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
              <div className="max-w-2xl">
                <div className="text-xs font-semibold uppercase tracking-[0.34em] text-[color:var(--kinova-blue-soft)]">
                  Final CTA
                </div>
                <h2 className="font-display text-balance mt-5 text-4xl font-semibold tracking-[-0.07em] sm:text-5xl">
                  Your next level starts here.
                </h2>
                <p className="mt-6 text-lg leading-8 text-white/74">
                  Start with a personalized plan built around your real level,
                  your training conditions, and the kind of progress you can
                  actually sustain.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row lg:flex-col">
                <a
                  href="#top"
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-[color:var(--kinova-blue)] px-7 text-base font-semibold text-white shadow-[0_18px_45px_rgba(15,55,189,0.38)] transition hover:bg-[color:#4e81ff]"
                >
                  Start with Kinova
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-14 items-center justify-center rounded-full border border-white/12 bg-white/[0.03] px-7 text-base font-semibold text-white transition hover:bg-white/[0.08]"
                >
                  Review the flow
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[color:var(--kinova-black)]">
        <div className="mx-auto max-w-[1240px] px-6 py-10 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-8 rounded-[1.9rem] border border-white/10 bg-white/[0.04] p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <BrandLogo
                  priority
                  size={28}
                  subtitle="A new era of personal movement."
                />
                <p className="mt-5 text-sm leading-7 text-white/62">
                  Kinova helps people train with more structure, smarter
                  progression, and a plan that fits how real progress actually
                  happens.
                </p>
              </div>

              <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/65">
                {navItems.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </a>
                ))}
                <a href="#top" className="transition hover:text-white">
                  Top
                </a>
              </nav>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 text-sm text-white/48 sm:flex-row sm:items-center sm:justify-between">
              <div>© 2026 Kinova. All rights reserved.</div>
              <div className="flex gap-5">
                <a href="#" className="transition hover:text-white">
                  Privacy
                </a>
                <a href="#" className="transition hover:text-white">
                  Terms
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
