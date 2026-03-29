import type { ReactNode } from "react";
import Link from "next/link";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  sideTitle: string;
  sideDescription: string;
  children: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  sideTitle,
  sideDescription,
  children,
}: AuthShellProps) {
  return (
    <section className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-start lg:py-20">
      <div className="space-y-6">
        <span className="pill pill-accent inline-flex px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]">
          {eyebrow}
        </span>
        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-[-0.05em] text-text-primary sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-text-secondary">
            {description}
          </p>
        </div>

        <div className="surface-card rounded-[1.8rem] p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-text-primary">
                {sideTitle}
              </p>
              <p className="mt-2 text-sm leading-7 text-text-secondary">
                {sideDescription}
              </p>
            </div>
            <span className="pill pill-secondary px-3 py-1 text-xs font-semibold">
              Clerk
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/6 bg-black/15 p-4">
              <p className="text-sm font-semibold text-text-primary">
                Same visual system
              </p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Dark surfaces, rounded cards, and accent colors are carried over from the frontend app.
              </p>
            </div>
            <div className="rounded-2xl border border-white/6 bg-black/15 p-4">
              <p className="text-sm font-semibold text-text-primary">
                Next step routes
              </p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                After sign-up, users can move into onboarding. Existing users can continue into the app shell.
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-surface px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-strong"
            >
              Back to landing
            </Link>
            <Link
              href="/app"
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-surface px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-strong"
            >
              App shell
            </Link>
          </div>
        </div>
      </div>

      <div className="surface-card rounded-[1.8rem] p-6">{children}</div>
    </section>
  );
}
