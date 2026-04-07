import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { navLinks } from "@/data/landing-content";
import { siteConfig } from "@/data/site-config";

export function LandingFooter() {
  return (
    <footer className="border-t border-white/8 bg-[#05070b] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:px-12">
        <div className="max-w-md">
          <BrandLogo
            subtitle="Adaptive training for real life"
            imageClassName="h-11"
          />
          <p className="mt-5 text-base leading-7 text-white/65">
            Kinova helps people train with structure, adapt after rough weeks,
            and keep moving without gym-first assumptions.
          </p>
        </div>

        <div>
          <p className="text-xs tracking-[0.24em] text-white/42 uppercase">
            Navigation
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-white/68 transition hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs tracking-[0.24em] text-white/42 uppercase">
            Company
          </p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/68">
            <Link href={siteConfig.ctaHref} className="transition hover:text-white">
              {siteConfig.ctaLabel}
            </Link>
            <a
              href={`mailto:${siteConfig.email}`}
              className="transition hover:text-white"
            >
              {siteConfig.email}
            </a>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="transition hover:text-white">
              Terms
            </Link>
          </div>
          <p className="mt-6 text-xs text-white/35">
            © 2026 {siteConfig.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
