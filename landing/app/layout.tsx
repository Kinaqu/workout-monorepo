import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { hasClerkCredentials } from "@/lib/clerk";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Workout",
    template: "%s | Workout",
  },
  description:
    "Landing and onboarding app styled to match the existing workout frontend, with Clerk-first authentication for Next.js.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appShell = (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(187,134,252,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(3,218,198,0.12),_transparent_24%)]" />
      <SiteHeader authEnabled={hasClerkCredentials} />
      <main className="relative z-10 flex-1">{children}</main>
      <SiteFooter />
    </div>
  );

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-bg text-text-primary">
        {hasClerkCredentials ? <ClerkProvider>{appShell}</ClerkProvider> : appShell}
      </body>
    </html>
  );
}
