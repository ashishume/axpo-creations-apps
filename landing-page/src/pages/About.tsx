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
              We are a team of passionate developers and strategists dedicated to simplifying complex business processes through intuitive software.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
             <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-80 w-full animate-pulse"></div>
             <div>
               <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
               <p className="text-muted-foreground leading-relaxed mb-6">
                 At AxpoCreation, our mission is to empower small to medium-sized enterprises and educational institutions with technology that was once only accessible to large corporations. We believe in democratizing access to efficient, automated, and data-driven management tools.
               </p>
               <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
               <p className="text-muted-foreground leading-relaxed">
                 To become the most trusted partner for digital transformation in the education and retail sectors across the region.
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
