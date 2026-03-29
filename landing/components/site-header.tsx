import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";

const navItems = [
  { href: "/#product", label: "Design" },
  { href: "/#features", label: "Flow" },
  { href: "/onboarding", label: "Onboarding" },
];

type SiteHeaderProps = {
  authEnabled: boolean;
};

function HeaderLinks() {
  return (
    <>
      <Link
        href="/sign-in"
        className="inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-surface px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-strong"
      >
        Sign in
      </Link>
      <Link
        href="/sign-up"
        className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-black transition-colors hover:bg-[#c89dff]"
      >
        Try it free
      </Link>
    </>
  );
}

export function SiteHeader({ authEnabled }: SiteHeaderProps) {
  return (
    <header className="relative z-20 border-b border-white/6 bg-black/35 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-black">
            W
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Workout</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-text-secondary">
              Landing App
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
                  className="hidden h-10 items-center justify-center rounded-full border border-white/10 bg-surface px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-strong sm:inline-flex"
                >
                  Open app
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
