import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const creatives = [
  {
    src: "/assets/meta-ads/01-split-together-settle-simply-1080x1080.png",
    title: "Split together. Settle simply.",
    description: "Create groups in seconds and keep every shared expense organized.",
    alt: "AXPO Splitter campaign showing shared trip, dinner, and rent groups in the app",
  },
  {
    src: "/assets/meta-ads/02-know-who-owes-what-1080x1080.png",
    title: "Know who owes what.",
    description: "See total spending, individual shares, and balances at a glance.",
    alt: "AXPO Splitter campaign showing group spending, member shares, and settlement balances",
  },
  {
    src: "/assets/meta-ads/03-trips-rent-dinner-1080x1080.png",
    title: "Trips. Rent. Dinner.",
    description: "One clear splitter for flatmates, getaways, dinners, and group events.",
    alt: "AXPO Splitter campaign for trips, flatmates, dinner bills, and group events",
  },
  {
    src: "/assets/meta-ads/04-split-track-settle-1080x1080.png",
    title: "Split. Track. Settle.",
    description: "Move from the first shared payment to the final settlement with confidence.",
    alt: "AXPO Splitter campaign showing the flow from expense groups to clear balances",
  },
] as const;

export function MetaAdsCarousel() {
  const reduceMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const showPrevious = useCallback(() => {
    setActiveIndex((current) => (current - 1 + creatives.length) % creatives.length);
  }, []);

  const showNext = useCallback(() => {
    setActiveIndex((current) => (current + 1) % creatives.length);
  }, []);

  useEffect(() => {
    if (paused || reduceMotion) return;
    const interval = window.setInterval(showNext, 6000);
    return () => window.clearInterval(interval);
  }, [paused, reduceMotion, showNext]);

  const activeCreative = creatives[activeIndex];

  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
      <motion.div
        aria-hidden="true"
        className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-violet-600/25 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 42, 0], y: [0, -24, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-24 bottom-8 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -32, 0], y: [0, 26, 0], scale: [1, 0.94, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container relative z-10 mx-auto px-4">
        <div
          className="grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") showPrevious();
            if (event.key === "ArrowRight") showNext();
          }}
          aria-roledescription="carousel"
          aria-label="AXPO Splitter campaign gallery"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
              <Sparkles className="h-3.5 w-3.5" /> AXPO Splitter
            </div>
            <h2 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              Shared spending, <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">beautifully clear.</span>
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Explore the features that make trips, rent, dinners, and everyday group expenses easier to manage.
            </p>

            <div className="mt-8 min-h-[88px]" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeCreative.title}
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.24 }}
                >
                  <h3 className="text-xl font-semibold text-white">{activeCreative.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{activeCreative.description}</p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={showPrevious}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:-translate-y-0.5 hover:border-violet-300/40 hover:bg-white/10"
                aria-label="Show previous campaign creative"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={showNext}
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-500/25 transition hover:-translate-y-0.5"
                aria-label="Show next campaign creative"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="ml-1 flex items-center gap-2" aria-label="Choose campaign creative">
                {creatives.map((creative, index) => (
                  <button
                    key={creative.src}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-violet-300" : "w-2.5 bg-white/25 hover:bg-white/50"}`}
                    aria-label={`Show creative ${index + 1}: ${creative.title}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="bg-white text-slate-950 shadow-xl hover:bg-slate-100" asChild>
                <Link href="/axpo">Download AXPO <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href="/expense-tracker-app">Explore all features</Link>
              </Button>
            </div>
          </motion.div>

          <motion.figure
            initial={reduceMotion ? false : { opacity: 0, x: 24, rotate: 1.5 }}
            whileInView={{ opacity: 1, x: 0, rotate: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: reduceMotion ? 0 : 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[680px]"
          >
            <div aria-hidden="true" className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-violet-500/25 via-transparent to-cyan-400/20 blur-2xl" />
            <div className="relative aspect-square overflow-hidden rounded-[2rem] border border-white/15 bg-white/5 p-2.5 shadow-2xl shadow-black/35 backdrop-blur-xl sm:p-3.5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.img
                  key={activeCreative.src}
                  src={activeCreative.src}
                  alt={activeCreative.alt}
                  className="absolute inset-2.5 h-[calc(100%-1.25rem)] w-[calc(100%-1.25rem)] rounded-[1.45rem] object-cover sm:inset-3.5 sm:h-[calc(100%-1.75rem)] sm:w-[calc(100%-1.75rem)]"
                  initial={reduceMotion ? false : { opacity: 0, scale: 1.025 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985 }}
                  transition={{ duration: reduceMotion ? 0 : 0.34, ease: "easeOut" }}
                />
              </AnimatePresence>
            </div>
            <figcaption className="sr-only">{activeCreative.title}</figcaption>
          </motion.figure>
        </div>
      </div>
    </section>
  );
}
