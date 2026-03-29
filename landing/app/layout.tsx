import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Manrope, Space_Grotesk } from "next/font/google";
import { hasClerkCredentials } from "@/lib/clerk";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const displayFont = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: {
    default: "Workout",
    template: "%s | Workout",
  },
  description:
    "A personalized workout plan that adapts to your level, evolves with your progress, and helps you reach your goal step by step.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appShell = (
    <div className="relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,255,99,0.12),_transparent_24%),radial-gradient(circle_at_85%_20%,_rgba(124,233,207,0.1),_transparent_22%)]" />
      <SiteHeader authEnabled={hasClerkCredentials} />
      <main className="relative z-10 flex-1">{children}</main>
      <SiteFooter />
    </div>
  );

  return (
    <html
      lang="en"
      className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-text-primary">
        {hasClerkCredentials ? <ClerkProvider>{appShell}</ClerkProvider> : appShell}
      </body>
    </html>
  );
}
