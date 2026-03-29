import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const navItems = [
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#comparison", label: "Why It Works" },
  { href: "/#adaptive", label: "Adaptive" },
  { href: "/#faq", label: "FAQ" },
];

type SiteHeaderProps = {
  authEnabled: boolean;
};

function HeaderLinks() {
  return (
    <>
      <Link
        href="/sign-in"
        className="inline-flex h-10 items-center justify-center rounded-full border border-white/12 bg-white/5 px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-white/10"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-[#0a130f] transition-colors hover:bg-[#e4ff92]"
      >
        Build my plan
      </Link>
    </>
  );
}

export function SiteHeader({ authEnabled }: SiteHeaderProps) {
  return (
    <header className="relative z-20 border-b border-white/6 bg-black/25 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-[#0a130f]">
            W
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Workout</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">
              Adaptive training
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-text-secondary md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {authEnabled ? (
            <>
              <Show when="signed-out">
                <HeaderLinks />
              </Show>
              <Show when="signed-in">
                <Link
                  href="/app"
                  className="hidden h-10 items-center justify-center rounded-full border border-white/12 bg-white/5 px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-white/10 sm:inline-flex"
                >
                  My plan
                </Link>
                <UserButton />
              </Show>
            </>
          ) : (
            <HeaderLinks />
          )}
        </div>
      </div>
    </header>
  );
}
