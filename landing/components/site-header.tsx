import Link from "next/link";

const navItems = [
  { href: "/#product", label: "Product" },
  { href: "/#features", label: "Features" },
  { href: "/onboarding", label: "Onboarding" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-page/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent text-sm font-semibold text-white">
            W
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Workout</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-muted">
              Landing App
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/sign-in"
          className="inline-flex h-10 items-center justify-center rounded-full border border-border bg-white/75 px-4 text-sm font-semibold text-ink transition-colors hover:bg-white"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
