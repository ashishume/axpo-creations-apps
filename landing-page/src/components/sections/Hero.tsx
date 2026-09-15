import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import heroBg from "@/assets/hero-bg.png"; // Assuming we generated this
import { CONTACT_WHATSAPP_URL } from "@/lib/constants";

const heroContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.1,
    },
  },
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.58, ease: [0.22, 1, 0.36, 1] },
  },
};

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-slate-950 pb-20 pt-32 text-white">
      {/* Midnight aurora background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#312e81_0%,_#0f172a_42%,_#020617_100%)]" aria-hidden />
      
        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.14] mix-blend-screen">
          <img
            src={heroBg}
             alt="Abstract Background" 
            className="h-full w-full object-cover"
            role="presentation"
          />
        </div>

        <motion.div
          aria-hidden="true"
          className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl"
          animate={reduceMotion ? undefined : {
            x: [0, 48, 12, 0],
            y: [0, 28, -12, 0],
            scale: [1, 1.12, 0.96, 1],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute -right-20 top-28 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl"
          animate={reduceMotion ? undefined : {
            x: [0, -38, -8, 0],
            y: [0, -20, 32, 0],
            scale: [1, 0.94, 1.1, 1],
          }}
          transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="absolute bottom-0 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-fuchsia-400/20 blur-3xl"
          animate={reduceMotion ? undefined : { opacity: [0.3, 0.75, 0.3], scaleX: [0.9, 1.1, 0.9] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="mx-auto max-w-4xl rounded-[2.25rem] border border-white/10 bg-white/[0.045] p-6 text-center shadow-2xl shadow-indigo-950/50 backdrop-blur-xl sm:p-10">
          <motion.div
            variants={heroContainer}
            initial={reduceMotion ? false : "hidden"}
            animate="show"
          >
            <motion.span
              variants={heroItem}
              className="mb-6 inline-block rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-sm font-semibold text-violet-200 shadow-[0_0_28px_rgba(167,139,250,0.18)]"
            >
              Android & iOS • Built for everyday money
            </motion.span>
            <motion.h1 variants={heroItem} className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
              Smart money, <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">simplified with AXPO</span>
            </motion.h1>
            <motion.p variants={heroItem} className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-slate-300 md:text-xl">
              Track personal expenses, manage shared bills, and keep lending records organized in one simple mobile app.
            </motion.p>
            
            <motion.div variants={heroItem} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div
                className="w-full sm:w-auto"
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.03 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              >
                <Button size="lg" className="h-12 w-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-base shadow-lg shadow-violet-500/25 transition-shadow hover:shadow-violet-500/40" asChild>
                  <Link href="/expense-tracker-app">
                    Explore AXPO
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                className="w-full sm:w-auto"
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.03 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              >
                <Button size="lg" variant="secondary" className="h-12 w-full bg-white px-8 text-base text-slate-950 hover:bg-slate-100" asChild>
                  <Link href="/axpo">
                    Download AXPO
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                className="w-full sm:w-auto"
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.03 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              >
                <Button size="lg" variant="outline" className="h-12 w-full border-white/20 bg-white/5 px-8 text-base text-white backdrop-blur-sm hover:bg-white/10 hover:text-white" asChild>
                  <a href={CONTACT_WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                    Contact Us
                  </a>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.62, duration: 0.55 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-300"
          >
            <motion.div className="flex items-center gap-2" whileHover={reduceMotion ? undefined : { y: -2 }}>
              <CheckCircle2 className="h-4 w-4 text-violet-300" />
              <span>Expense Insights</span>
            </motion.div>
            <motion.div className="flex items-center gap-2" whileHover={reduceMotion ? undefined : { y: -2 }}>
              <CheckCircle2 className="h-4 w-4 text-violet-300" />
              <span>Shared Splits</span>
            </motion.div>
            <motion.div className="flex items-center gap-2" whileHover={reduceMotion ? undefined : { y: -2 }}>
              <CheckCircle2 className="h-4 w-4 text-violet-300" />
              <span>Lending Records</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
