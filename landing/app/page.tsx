import { BackdropStage } from "@/components/landing/backdrop-stage";
import { CinematicHero } from "@/components/landing/cinematic-hero";
import { DownloadSection } from "@/components/landing/download-section";
import { FaqSection } from "@/components/landing/faq-section";
import { LandingFooter } from "@/components/landing/footer";
import { FreeSection } from "@/components/landing/free-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProSection } from "@/components/landing/pro-section";

export default function Home() {
  return (
    <main className="relative bg-[#05070b] text-white">
      <BackdropStage />
      <CinematicHero />
      <FreeSection />
      <ProSection />
      <PricingSection />
      <FaqSection />
      <DownloadSection />
      <LandingFooter />
    </main>
  );
}
