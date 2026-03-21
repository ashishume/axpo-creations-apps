import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Features } from "@/components/sections/Features";
import { APPS } from "@/lib/constants";

export default function Products() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4 mb-12">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-center mb-6">Our Solutions</h1>
          <p className="text-lg text-muted-foreground text-center max-w-2xl mx-auto">
            AI-powered billing and school finance—{APPS.biller.name} and {APPS.eduFinance.name}—plus {APPS.tracker.name} for personal expenses, group splits, and lending on Android and iOS.
          </p>
        </div>
        <Features />
      </main>
      <Footer />
    </div>
  );
}
