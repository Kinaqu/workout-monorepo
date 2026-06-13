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
            subtitle="Coming soon"
            imageClassName="h-12"
            titleClassName="text-base"
          />

          <p className="mt-8 text-xs tracking-[0.28em] text-[#8ab4ff] uppercase">
            Get notified
          </p>
          <h1 className="mt-5 font-display text-4xl leading-tight font-semibold tracking-[-0.05em] sm:text-5xl">
            Tell Kinova how you train now.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
            Kinova is coming to the App Store and Google Play. Join the list and
            we&apos;ll tell you the moment it&apos;s live — share your goal,
            setup, and routine so your first plan fits.
          </p>

          <div className="mt-8 grid gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 text-sm text-white/72 sm:grid-cols-3">
            <div>
              <p className="text-xs tracking-[0.22em] text-[#8ab4ff] uppercase">
                01
              </p>
              <p className="mt-2">Share your current setup and goal.</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.22em] text-[#8ab4ff] uppercase">
                02
              </p>
              <p className="mt-2">We review whether Kinova fits your setup.</p>
            </div>
            <div>
              <p className="text-xs tracking-[0.22em] text-[#8ab4ff] uppercase">
                03
              </p>
              <p className="mt-2">We email you the moment Kinova is live.</p>
            </div>
          </div>

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
                Interest
              </span>
              <select
                name="interest"
                defaultValue="Free daily minimum"
                className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none transition focus:border-[#125bff]"
              >
                <option className="bg-[#08111f]">Free daily minimum</option>
                <option className="bg-[#08111f]">Pro — progression engine</option>
                <option className="bg-[#08111f]">Premium — AI coach</option>
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-medium text-white/78">
                Your routine
              </span>
              <textarea
                name="context"
                rows={5}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-white outline-none transition placeholder:text-white/28 focus:border-[#125bff]"
                placeholder="How often you train, where you train, and what usually gets in the way."
              />
            </label>

            <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/64">
              This button opens your email app with these details filled in for{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="text-white underline decoration-white/25 underline-offset-4"
              >
                {siteConfig.email}
              </a>
              . If you prefer, you can also email the same details directly.
            </div>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-semibold text-[#05070b] transition hover:bg-[#dbe7ff]"
            >
              Open Email Draft
              <ArrowIcon />
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
