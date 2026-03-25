import Navigation from "@/components/sections/navigation";
import HeroSection from "@/components/sections/hero";
import AppPreview from "@/components/sections/app-preview";
import HowItWorks from "@/components/sections/how-it-works";
import LearningExperience from "@/components/sections/learning-experience";
import FinanceTracks from "@/components/sections/finance-tracks";
import AIExplainer from "@/components/sections/ai-explainer";
import TargetAudience from "@/components/sections/target-audience";
import CTA from "@/components/sections/cta";
import Footer from "@/components/sections/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0f1c]">
      <Navigation />
      <HeroSection />
      <AppPreview />
      <HowItWorks />
      <LearningExperience />
      <FinanceTracks />
      <AIExplainer />
      <TargetAudience />
      <CTA />
      <Footer />
    </main>
  );
}
