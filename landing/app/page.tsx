import Link from "next/link";
import { FeatureCard } from "@/components/feature-card";

const featureCards = [
  {
    title: "Focused first-run flow",
    description:
      "A dedicated surface for acquisition, sign-in, and onboarding without disturbing the existing product apps.",
  },
  {
    title: "Vercel-friendly architecture",
    description:
      "Next.js App Router, TypeScript, and Tailwind provide a clean deployment path for fast iteration on marketing and onboarding.",
  },
  {
    title: "Clear extension points",
    description:
      "Authentication, backend integration, and workout generation remain intentionally deferred behind explicit placeholders.",
  },
];

const flowSteps = [
  {
    label: "01",
    title: "Discover the product",
    description:
      "Explain the value proposition simply and get visitors into the product with a single primary CTA.",
  },
  {
    label: "02",
    title: "Collect setup inputs",
    description:
      "Use the onboarding route later for goals, experience, and equipment preferences when that work is ready.",
  },
  {
    label: "03",
    title: "Hand off into the app",
    description:
      "After onboarding is complete, transition users into the app surface without mixing concerns into this foundation step.",
  },
];

export default function Home() {
  return (
    <div className="pb-20">
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 pb-16 pt-16 lg:grid-cols-[minmax(0,1.2fr)_24rem] lg:items-center lg:pt-24">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-3 rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted shadow-sm">
            <span className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              New App
            </span>
            <span>Landing and onboarding foundation, separate from the existing product.</span>
          </div>
          <div className="space-y-6">
            <h1 className="max-w-3xl text-5xl font-semibold tracking-[-0.05em] text-ink sm:text-6xl">
              Training plans that adapt to real weeks, not ideal ones.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-muted sm:text-xl">
              This new Next.js app is the future home for acquisition, sign-in, and first-run personalization.
              It stays isolated from the existing React frontend and Cloudflare Workers API while the product foundation evolves.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href="/sign-in"
              className="inline-flex h-12 items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-accent-strong"
            >
              Try it free
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex h-12 items-center justify-center rounded-full border border-border bg-white/70 px-6 text-sm font-semibold text-ink transition-colors hover:bg-white"
            >
              Preview onboarding
            </Link>
          </div>
          <div className="grid gap-3 text-sm text-muted sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Standalone</p>
              <p className="mt-2">Owns landing and onboarding without rewriting the existing apps.</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Deferred</p>
              <p className="mt-2">Clerk, backend calls, and workout generation are intentionally not wired yet.</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/70 p-4">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-accent">Deployable</p>
              <p className="mt-2">Ready for Vercel with App Router, TypeScript, and Tailwind in place.</p>
            </div>
          </div>
        </div>

        <aside className="glass-panel rounded-[2rem] border border-white/70 p-6 shadow-[0_24px_80px_rgba(23,28,40,0.12)]">
          <div className="rounded-[1.5rem] border border-border bg-surface-strong p-6">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              Future Journey
            </p>
            <div className="mt-6 space-y-5">
              {flowSteps.map((step) => (
                <div key={step.label} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-semibold text-accent-strong">
                    {step.label}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-ink">{step.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section id="product" className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="grid gap-8 rounded-[2rem] border border-border bg-white/75 p-8 shadow-sm lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">
              Product Direction
            </p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink">
              A dedicated first-touch experience for conversion and setup.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-muted">
              The landing app will eventually guide a visitor from product story to authentication and onboarding,
              then hand off into the main experience. For this step, the structure and route boundaries are the product.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-dashed border-border bg-page/70 p-6 text-sm leading-7 text-muted">
            <p className="font-semibold text-ink">Foundation guardrails</p>
            <p className="mt-3">
              No backend contract changes, no authentication wiring, and no workout generation logic have been added here.
            </p>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-3">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">Feature Areas</p>
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-ink">
            Built to grow one concern at a time.
          </h2>
          <p className="max-w-2xl text-base leading-7 text-muted">
            The initial app shell keeps the codebase modular so later tasks can add real auth, onboarding state, and product integration without reworking the foundation.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featureCards.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>
    </div>
  );
}
