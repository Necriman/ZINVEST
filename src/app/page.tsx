import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import HeroSection from "@/components/sections/hero";
import HowItWorks from "@/components/sections/how-it-works";
import LearningExperience from "@/components/sections/learning-experience";
import FinanceTracks from "@/components/sections/finance-tracks";
import TargetAudience from "@/components/sections/target-audience";
import AppPreview from "@/components/sections/app-preview";
import CTA from "@/components/sections/cta";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0f1c]">
      <Navigation />
      <HeroSection />
      <HowItWorks />
      <LearningExperience />
      <FinanceTracks />
      <TargetAudience />
      <AppPreview />
      <CTA />
      <Footer />
    </main>
  );
}
