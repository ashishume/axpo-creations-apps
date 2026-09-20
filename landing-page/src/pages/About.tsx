import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Founders } from "@/components/sections/Founders";
import { motion } from "framer-motion";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">About AxpoCreation</h1>
            <p className="text-lg text-muted-foreground">
              We are the team behind AXPO, focused on making everyday money management clear, fast, and accessible.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
             <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-80 w-full animate-pulse"></div>
             <div>
               <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
               <p className="text-muted-foreground leading-relaxed mb-6">
                 Our mission is to help individuals and families understand spending, organize shared expenses, and manage lending records without unnecessary complexity.
               </p>
               <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
               <p className="text-muted-foreground leading-relaxed">
                 To make AXPO a trusted everyday companion for personal and shared financial organization.
               </p>
             </div>
          </div>
          
          <Founders />
        </div>
      </main>
      <Footer />
    </div>
  );
}
