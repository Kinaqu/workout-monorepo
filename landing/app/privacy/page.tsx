import Link from "next/link";
import { siteConfig } from "@/data/site-config";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-3xl px-6 py-14 sm:px-8">
        <Link href="/" className="text-sm text-white/62 transition hover:text-white">
          Back to home
        </Link>
        <p className="mt-10 text-xs tracking-[0.28em] text-[#8ab4ff] uppercase">
          Privacy
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em]">
          Privacy policy
        </h1>
        <div className="mt-8 space-y-6 text-base leading-8 text-white/72">
          <p>
            Kinova should only collect information needed to evaluate early
            access requests, onboard users into the product, and support
            adaptive planning.
          </p>
          <p>
            Prelaunch submissions may include name, email, training goals,
            equipment context, and other voluntary notes shared through the
            early-access flow.
          </p>
          <p>
            To request deletion or ask questions about submitted information,
            contact{" "}
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
