import type { ReactNode } from "react";
import Link from "next/link";

type PlaceholderShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  nextHref: string;
  nextLabel: string;
  notes: string[];
  children?: ReactNode;
};

export function PlaceholderShell({
  eyebrow,
  title,
  description,
  nextHref,
  nextLabel,
  notes,
  children,
}: PlaceholderShellProps) {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6 rounded-[2rem] border border-border bg-white/75 p-8 shadow-sm">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">{eyebrow}</p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-ink sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-muted">{description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {notes.map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-border bg-page/70 p-4 text-sm leading-6 text-muted"
              >
                {note}
              </div>
            ))}
          </div>

          {children}
        </div>

        <aside className="glass-panel rounded-[2rem] border border-white/70 p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-accent">Next Route</p>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-ink">{nextLabel}</p>
          <p className="mt-3 text-sm leading-7 text-muted">
            These placeholder routes are wired now so later tasks can add real state and product logic without changing the shell structure.
          </p>
          <Link
            href={nextHref}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-accent-strong"
          >
            Go to {nextLabel}
          </Link>
        </aside>
      </div>
    </section>
  );
}
