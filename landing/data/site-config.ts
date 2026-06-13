export const siteConfig = {
  name: "Kinova",
  title: "Kinova | The daily minimum is free. Progression is the product.",
  description:
    "Kinova gives everyone a free daily routine to hold their baseline — ten push-ups, ten squats, ten dips, a plank — and gives Pro members an adaptive weekly plan that advances, holds, or regresses with how training actually goes.",
  domain: "kinova.app",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "team@kinova.app",
  socialHandle: "@kinovamove",
  ctaHref: "/early-access",
  ctaLabel: "Get the app",
  // No real store listings exist yet — the badges read "coming soon" and route
  // to the early-access waitlist until the iOS/Android apps ship.
  appStoreHref: "/early-access",
  playStoreHref: "/early-access",
} as const;

export const siteUrl = new URL(siteConfig.siteUrl);
