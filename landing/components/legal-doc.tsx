import Link from "next/link";
import type { ReactNode } from "react";

/* Shared shell + section primitives for the /privacy and /terms documents so
   both read consistently. Plain, high-contrast, on the page's dark surface. */
export function LegalDoc({
  eyebrow,
  title,
  updated,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#05070b] text-white">
      <div className="mx-auto max-w-3xl px-6 py-14 sm:px-8">
        <Link
          href="/"
          className="text-sm text-white/62 transition hover:text-white"
        >
          ← Back to home
        </Link>
        <p className="mt-10 text-xs tracking-[0.28em] text-[#8ab4ff] uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-[-0.05em]">
          {title}
        </h1>
        <p className="mt-3 text-sm text-white/45">Last updated: {updated}</p>
        <div className="mt-8 text-base leading-8 text-white/72">{intro}</div>
        <div className="mt-10 space-y-10">{children}</div>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4 text-base leading-8 text-white/72">
      <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-white">
        {title}
      </h2>
      {children}
    </section>
  );
}
