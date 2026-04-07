import { AudienceSection } from "@/components/landing/audience-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FeatureGridSection } from "@/components/landing/feature-grid-section";
import { LandingFooter } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProofSection } from "@/components/landing/proof-section";
import { TrustBar } from "@/components/landing/trust-bar";

export default function Home() {
  return (
    <main className="bg-[#05070b] text-white">
      <HeroSection />
      <TrustBar />
      <HowItWorksSection />
      <AudienceSection />
      <FeatureGridSection />
      <ProofSection />
      <PricingSection />
      <FaqSection />
      <LandingFooter />
    </main>
  );
}
