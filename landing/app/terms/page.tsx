import Link from "next/link";
import { siteConfig } from "@/data/site-config";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-3xl px-6 py-14 sm:px-8">
        <Link href="/" className="text-sm text-white/62 transition hover:text-white">
          Back to home
        </Link>
        <p className="mt-10 text-xs tracking-[0.28em] text-[#8ab4ff] uppercase">
          Terms
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em]">
          Terms of use
        </h1>
        <div className="mt-8 space-y-6 text-base leading-8 text-white/72">
          <p>
            Kinova is currently presented as a prelaunch product experience.
            Information on the site describes intended product behavior and early
            access positioning rather than final commercial terms.
          </p>
          <p>
            Access may be limited, adjusted, or paused while onboarding and beta
            availability are evaluated.
          </p>
          <p>
            For direct questions about access, usage, or launch timing, contact{" "}
            <a
              href={`mailto:${siteConfig.email}`}
              className="text-white underline decoration-white/25 underline-offset-4"
            >
              {siteConfig.email}
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
