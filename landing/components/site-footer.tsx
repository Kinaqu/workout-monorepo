import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-text-secondary lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-semibold text-text-primary">Workout</p>
          <p className="mt-2 max-w-xl">
            Personalized workouts for home, outdoors, and steady progress that adapts to
            your real level.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.18em] text-text-tertiary">
          <Link href="/#how-it-works" className="transition-colors hover:text-text-primary">
            How It Works
          </Link>
          <Link href="/#benefits" className="transition-colors hover:text-text-primary">
            Benefits
          </Link>
          <Link href="/#adaptive" className="transition-colors hover:text-text-primary">
            Adaptive
          </Link>
          <Link href="/#faq" className="transition-colors hover:text-text-primary">
            FAQ
          </Link>
        </div>
      </div>
    </footer>
  );
}
