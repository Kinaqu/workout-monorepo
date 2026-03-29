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
        <div className="surface-card space-y-6 rounded-[1.8rem] p-8">
          <div className="space-y-3">
            <p className="pill pill-accent inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
              {eyebrow}
            </p>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-text-primary sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-text-secondary">{description}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {notes.map((note) => (
              <div
                key={note}
                className="rounded-2xl border border-white/6 bg-black/15 p-4 text-sm leading-6 text-text-secondary"
              >
                {note}
              </div>
            ))}
          </div>

          {children}
        </div>

        <aside className="surface-card rounded-[1.8rem] p-6">
          <p className="pill inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
            Next Route
          </p>
          <p className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-text-primary">
            {nextLabel}
          </p>
          <p className="mt-3 text-sm leading-7 text-text-secondary">
            These placeholder routes are wired now so later tasks can add real state and product logic without changing the shell structure.
          </p>
          <Link
            href={nextHref}
            className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-semibold text-black transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#c89dff]"
          >
            Go to {nextLabel}
          </Link>
        </aside>
      </div>
    </section>
  );
}
