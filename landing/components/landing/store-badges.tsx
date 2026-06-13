import Link from "next/link";
import { siteConfig } from "@/data/site-config";

function AppleGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 384 512" className="h-8 w-8 fill-current">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

function PlayGlyph() {
  return (
    <svg aria-hidden="true" viewBox="0 0 512 512" className="h-7 w-7 fill-current">
      <path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
    </svg>
  );
}

/* The page's primary call to action: large, tactile App Store / Google Play
   badges. No real listings exist yet, so both link to the early-access waitlist
   and the page reads "coming soon". Reused in the hero and the closing band. */
export function StoreBadges({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`.trim()}>
      <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
        <Link
          href={siteConfig.appStoreHref}
          aria-label="Download Kinova on the App Store — coming soon"
          className="cine-store-badge group flex items-center justify-center gap-3.5 rounded-2xl px-7 py-4 text-white"
        >
          <span className="text-white transition-transform group-hover:scale-110">
            <AppleGlyph />
          </span>
          <span className="text-left">
            <span className="block text-[0.62rem] font-semibold tracking-[0.16em] text-white/65 uppercase">
              Download on the
            </span>
            <span className="block font-display text-xl leading-none font-semibold">
              App Store
            </span>
          </span>
        </Link>

        <Link
          href={siteConfig.playStoreHref}
          aria-label="Get Kinova on Google Play — coming soon"
          className="cine-store-badge group flex items-center justify-center gap-3.5 rounded-2xl px-7 py-4 text-white"
        >
          <span className="text-white transition-transform group-hover:scale-110">
            <PlayGlyph />
          </span>
          <span className="text-left">
            <span className="block text-[0.62rem] font-semibold tracking-[0.16em] text-white/65 uppercase">
              Get it on
            </span>
            <span className="block font-display text-xl leading-none font-semibold">
              Google Play
            </span>
          </span>
        </Link>
      </div>

      <p className="text-xs font-medium tracking-[0.14em] text-white/45 uppercase">
        Coming soon · iOS &amp; Android
      </p>
    </div>
  );
}
