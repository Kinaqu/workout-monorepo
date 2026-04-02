export const siteConfig = {
  name: "Kinova",
  title: "Kinova | Adaptive training for your real level",
  description:
    "Kinova builds adaptive workout plans around your current level, schedule, and setup so you can train at home, outdoors, or with minimal equipment and keep progressing without guesswork.",
  domain: "kinova.app",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "team@kinova.app",
  socialHandle: "@kinovamove",
  ctaHref: "/early-access",
  ctaLabel: "Request Early Access",
} as const;

export const siteUrl = new URL(siteConfig.siteUrl);
