import { BackdropStage } from "@/components/landing/backdrop-stage";
import { CatalogMarquee } from "@/components/landing/catalog-marquee";
import { DeckCard } from "@/components/landing/deck-card";
import { DeckPins } from "@/components/landing/deck-pins";
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
    <main className="relative bg-[#05070b] text-white">
      <BackdropStage />
      <DeckPins />
      <div className="deck">
        <DeckCard>
          <HeroSection />
          <div className="mt-auto">
            <CatalogMarquee />
          </div>
        </DeckCard>
        <DeckCard>
          <FreeSection />
        </DeckCard>
        <DeckCard>
          <ProSection />
          <HowItWorksSection />
        </DeckCard>
        <DeckCard solid>
          <PricingSection />
        </DeckCard>
        <DeckCard>
          <FaqSection />
          <FinalCtaSection />
          <LandingFooter />
        </DeckCard>
      </div>
    </main>
  );
}
