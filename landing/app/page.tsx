import Link from "next/link";
import { FeatureCard } from "@/components/feature-card";

const featureCards = [
  {
    eyebrow: "Today",
    title: "Daily surface first",
    description:
      "The landing hero now borrows the same dark card language, pill system, and mobile-first composition as the existing workout app.",
  },
  {
    eyebrow: "Auth",
    title: "Clerk-first entry",
    description:
      "Sign-in and sign-up are real Clerk routes in Next.js App Router instead of placeholders, with the same appearance model carried over from frontend.",
  },
  {
    eyebrow: "Flow",
    title: "Protected next steps",
    description:
      "Onboarding and post-onboarding routes are ready to sit behind Clerk protection once keys are configured in the landing project.",
  },
];

export default function Home() {
  return (
    <div className="pb-20">
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-6 pb-16 pt-12 lg:grid-cols-[minmax(0,1.1fr)_26rem] lg:items-center lg:pt-20">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/8 bg-surface px-4 py-2 text-sm text-text-secondary">
            <span className="pill pill-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
              Frontend-based
            </span>
            <span>Landing now follows the same visual system as the core app.</span>
          </div>

          <div className="space-y-5">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-text-primary sm:text-6xl">
              Start the same workout experience from the first screen.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-text-secondary sm:text-xl">
              The new landing app now mirrors the dark card-based style of the existing frontend and uses a real Clerk-first auth flow in Next.js instead of placeholder screens.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#c89dff]"
            >
              Try it free
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-surface px-6 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-strong"
            >
              Sign in
            </Link>
          </div>

          <div className="grid gap-3 text-sm text-text-secondary sm:grid-cols-3">
            <div className="surface-card rounded-[1.4rem] p-4">
              <p className="pill pill-accent inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                Shared palette
              </p>
              <p className="mt-3">Same black surfaces, violet actions, and teal accent as the existing app.</p>
            </div>
            <div className="surface-card rounded-[1.4rem] p-4">
              <p className="pill pill-secondary inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                Real auth
              </p>
              <p className="mt-3">Clerk routes are now part of the landing app instead of a future TODO.</p>
            </div>
            <div className="surface-card rounded-[1.4rem] p-4">
              <p className="pill inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
                Route split
              </p>
              <p className="mt-3">Marketing stays in `landing/`, while onboarding and app continue as separate steps.</p>
            </div>
          </div>
        </div>

        <aside className="surface-card rounded-[1.8rem] p-6">
          <div className="space-y-5 rounded-[1.4rem] border border-white/6 bg-surface-muted p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-text-primary">Today</p>
                <p className="text-sm text-text-secondary">Frontend-style preview</p>
              </div>
              <span className="pill pill-accent px-3 py-1 text-xs font-semibold">Pull</span>
            </div>

            <div className="rounded-[1.35rem] border border-white/6 bg-surface-strong p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-2xl font-semibold text-text-primary">Upper Strength</p>
                  <p className="mt-1 text-sm text-text-secondary">
                    Same card hierarchy the main app already uses.
                  </p>
                </div>
                <span className="pill pill-secondary px-3 py-1 text-xs font-semibold">
                  4 sets
                </span>
              </div>
              <div className="mt-5 space-y-3">
                {["Warm up pull-ups", "Ring rows", "Tempo curls"].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center justify-between rounded-2xl border border-white/6 bg-black/15 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{item}</p>
                      <p className="text-xs text-text-secondary">Set {index + 1}</p>
                    </div>
                    <span className="pill px-3 py-1 text-xs font-semibold">Track</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section id="product" className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-8 rounded-[1.8rem] border border-white/6 bg-surface p-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <p className="pill pill-accent inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
              Design base
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-text-primary">
              The landing no longer feels like a separate product.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-text-secondary">
              Instead of a light generic SaaS page, the new shell borrows the visual grammar of the workout frontend: dark surfaces, rounded panels, compact pills, and a more app-native first impression.
            </p>
          </div>

          <div className="rounded-[1.4rem] border border-dashed border-white/10 bg-black/15 p-6 text-sm leading-7 text-text-secondary">
            <p className="font-semibold text-text-primary">Auth status</p>
            <p className="mt-3">
              Clerk is integrated in code. To make production auth actually work, this Vercel project still needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-3">
          <p className="pill inline-flex w-fit px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            What changed
          </p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-text-primary">
            The structure now matches the intended product flow.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-text-secondary">
            The landing app now owns acquisition and authentication properly, while keeping onboarding and app handoff as separate routes ready for the next feature steps.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featureCards.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pt-6">
        <div className="surface-card flex flex-col gap-4 rounded-[1.8rem] p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-2xl font-semibold text-text-primary">Ready to move the auth entrypoint into Next.js</p>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-text-secondary">
              Sign up now routes into Clerk, and signed-in users can continue into onboarding and the app shell from the same visual system as the main frontend.
            </p>
          </div>
          <Link
            href="/sign-up"
            className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-6 text-sm font-semibold text-black transition-colors hover:bg-[#c89dff]"
          >
            Create account
          </Link>
        </div>
      </section>
    </div>
  );
}
