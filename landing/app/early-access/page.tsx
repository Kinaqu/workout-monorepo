import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { siteConfig } from "@/data/site-config";
import { ArrowIcon } from "@/components/landing/icons";

export default function EarlyAccessPage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/62 transition hover:text-white"
        >
          <span className="rotate-180">
            <ArrowIcon />
          </span>
          Back to landing page
        </Link>

        <div className="mt-10 rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,_rgba(8,17,31,0.96),_rgba(5,7,11,0.98))] p-7 shadow-[0_30px_120px_rgba(5,7,11,0.48)] sm:p-10">
          <BrandLogo
            subtitle="Early access application"
            imageClassName="h-12"
            titleClassName="text-base"
          />

          <p className="mt-8 text-xs tracking-[0.28em] text-[#8ab4ff] uppercase">
            Request Access
          </p>
          <h1 className="mt-5 font-display text-4xl leading-tight font-semibold tracking-[-0.05em] sm:text-5xl">
            Tell Kinova how you train now.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
            This flow is built for focused prelaunch users. Share your context,
            equipment, and goal so Kinova can prioritize early access with
            better fit and clearer onboarding.
          </p>

          <form
            action={`mailto:${siteConfig.email}`}
            method="post"
            encType="text/plain"
            className="mt-10 grid gap-5"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-white/78">
                  Name
                </span>
                <input
                  type="text"
                  name="name"
                  required
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none transition placeholder:text-white/28 focus:border-[#125bff]"
                  placeholder="Your name"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-white/78">
                  Email
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none transition placeholder:text-white/28 focus:border-[#125bff]"
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-white/78">
                  Primary goal
                </span>
                <input
                  type="text"
                  name="goal"
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none transition placeholder:text-white/28 focus:border-[#125bff]"
                  placeholder="Strength, consistency, movement quality..."
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-white/78">
                  Current setup
                </span>
                <input
                  type="text"
                  name="setup"
                  className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none transition placeholder:text-white/28 focus:border-[#125bff]"
                  placeholder="Home, outdoors, bands, pull-up bar..."
                />
              </label>
            </div>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-white/78">
                Training context
              </span>
              <textarea
                name="context"
                rows={5}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none transition placeholder:text-white/28 focus:border-[#125bff]"
                placeholder="How often you train, where you are starting from, and what usually gets in the way."
              />
            </label>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/64">
              Submitting opens your email client with the application details
              prefilled to{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-white underline decoration-white/25 underline-offset-4"
              >
                {siteConfig.email}
              </a>
              . Replace this address in `data/site-config.ts` if the project
              uses a different contact inbox.
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#05070b] transition hover:bg-[#dbe7ff]"
            >
              Send Early Access Request
              <ArrowIcon />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
