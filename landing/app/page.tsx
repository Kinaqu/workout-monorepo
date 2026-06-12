import { CatalogMarquee } from "@/components/landing/catalog-marquee";
import { FaqSection } from "@/components/landing/faq-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { LandingFooter } from "@/components/landing/footer";
import { FreeSection } from "@/components/landing/free-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProSection } from "@/components/landing/pro-section";

export default function Home() {
  return (
    <main className="bg-[#05070b] text-white">
      <HeroSection />
      <CatalogMarquee />
      <FreeSection />
      <ProSection />
      <HowItWorksSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
      <LandingFooter />
    </main>
  );
}
