import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { Founders } from "@/components/sections/Founders";
import { MetaAdsCarousel } from "@/components/sections/MetaAdsCarousel";
import { MindstrikeShowcase } from "@/components/sections/MindstrikeShowcase";
import { FitnessShowcase } from "@/components/sections/FitnessShowcase";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <MetaAdsCarousel />
        <FitnessShowcase />
        <MindstrikeShowcase />
        <Founders />
      </main>
      <Footer />
    </div>
  );
}
