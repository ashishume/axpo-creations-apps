import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { Features } from "@/components/sections/Features";
import { Founders } from "@/components/sections/Founders";
import { MetaAdsCarousel } from "@/components/sections/MetaAdsCarousel";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <Features />
        <MetaAdsCarousel />
        <Founders />
      </main>
      <Footer />
    </div>
  );
}
