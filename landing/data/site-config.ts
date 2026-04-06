export const siteConfig = {
  name: "Kinova",
  title: "Kinova | Adaptive strength plans for real-life training",
  description:
    "Kinova builds adaptive strength plans around your current level, schedule, and setup so you can train at home, outdoors, or with minimal equipment and keep progressing without guesswork.",
  domain: "kinova.app",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "team@kinova.app",
  socialHandle: "@kinovamove",
  ctaHref: "/early-access",
  ctaLabel: "Join Early Access",
} as const;

export const siteUrl = new URL(siteConfig.siteUrl);
