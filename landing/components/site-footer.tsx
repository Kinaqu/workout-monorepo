export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/6">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-6 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
        <p>Landing app aligned to the core frontend and ready for Clerk-based entry.</p>
        <p className="text-xs uppercase tracking-[0.18em] text-text-tertiary">
          Next.js • Clerk • Vercel
        </p>
      </div>
    </footer>
  );
}
