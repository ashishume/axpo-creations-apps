import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import heroBg from "@/assets/hero-bg.png"; // Assuming we generated this

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background: light blue-grey base + clearly visible but muted abstract shapes */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,28%,97%)] via-[hsl(220,24%,95%)] to-[hsl(220,20%,93%)] dark:from-[hsl(222,30%,96%)] dark:to-[hsl(222,25%,92%)]" aria-hidden />
      
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-0 opacity-10">
          <img
            src={heroBg}
             alt="Abstract Background" 
          className="w-full h-full object-cover"
            role="presentation"
          />
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
              AI-Powered • Built for Growth
            </span>
            <h1 className="text-4xl md:text-6xl font-heading font-bold tracking-tight text-foreground mb-6 leading-tight">
              Smarter Software for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-600">Billing & Education</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              From AI-enhanced billing and inventory (axpo Biller) to intelligent school finance (axpo EduFinance), we build the tools that scale with you.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow">
                Explore Our Products
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base bg-white/50 backdrop-blur-sm">
                Contact Sales
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>AI-Powered Insights</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Enterprise Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Secure & Scalable</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
