import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import HeroSection from "@/components/sections/hero";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-background">
      <Navigation />
      <HeroSection />
      <Footer />
    </main>
  );
}
