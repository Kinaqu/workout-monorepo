import { AudienceSection } from "@/components/landing/audience-section";
import { ComparisonSection } from "@/components/landing/comparison-section";
import { FaqSection } from "@/components/landing/faq-section";
import { FeatureGridSection } from "@/components/landing/feature-grid-section";
import { LandingFooter } from "@/components/landing/footer";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { MethodSection } from "@/components/landing/method-section";
import { PricingSection } from "@/components/landing/pricing-section";
import { ProgressionSection } from "@/components/landing/progression-section";
import { ProofSection } from "@/components/landing/proof-section";
import { TrustBar } from "@/components/landing/trust-bar";

export default function Home() {
  return (
    <main className="bg-[#05070b] text-white">
      <HeroSection />
      <TrustBar />
      <HowItWorksSection />
      <FeatureGridSection />
      <ComparisonSection />
      <AudienceSection />
      <ProgressionSection />
      <ProofSection />
      <MethodSection />
      <PricingSection />
      <FaqSection />
      <FinalCtaSection />
      <LandingFooter />
    </main>
  );
}
