import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { navLinks } from "@/data/landing-content";
import { siteConfig } from "@/data/site-config";
import { ArrowIcon } from "./icons";

export function LandingHeader() {
  return (
    <header className="sticky top-4 z-40 mb-14 rounded-full border border-white/10 bg-[#08111f]/78 px-4 py-3 shadow-[0_18px_50px_rgba(5,7,11,0.22)] backdrop-blur-xl">
      <div className="flex items-center justify-between gap-6">
        <BrandLogo
          priority
          subtitle="Adaptive Training"
          imageClassName="h-10 sm:h-11"
          titleClassName="text-sm sm:text-base"
        />

        <nav
          aria-label="Primary navigation"
          className="hidden items-center gap-8 lg:flex"
        >
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-white/66 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <Link
          href={siteConfig.ctaHref}
          className="inline-flex items-center gap-2 rounded-full bg-[#125bff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2e72ff]"
        >
          Join Early Access
          <ArrowIcon />
        </Link>
      </div>
    </header>
  );
}
