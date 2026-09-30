import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APPS } from "@/lib/constants";

const screenshots = [
  {
    src: "/assets/mindstrike/01-ready-set-outthink.jpg",
    title: "Ready, set. Outthink.",
    alt: "Mindstrike Arena screen with the ranked duel card and Quick Spark warm-up",
  },
  {
    src: "/assets/mindstrike/02-beat-the-clock.jpg",
    title: "Quick thinking. Every second.",
    alt: "Mindstrike live number duel with a 90-second timer and answer keypad",
  },
  {
    src: "/assets/mindstrike/03-find-your-flow.jpg",
    title: "Your pace. Your challenge.",
    alt: "Mindstrike solo practice setup with timer and difficulty choices",
  },
  {
    src: "/assets/mindstrike/04-play-in-colour.jpg",
    title: "Make it yours. Play in colour.",
    alt: "Mindstrike theme picker showing six colour themes",
  },
] as const;

export function MindstrikeShowcase() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="mindstrike-showcase-title"
      className="relative overflow-hidden bg-[#0b2a2a] py-24 text-white"
    >
      <motion.div
        aria-hidden="true"
        className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-amber-300/10 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, -30, 0], y: [0, 24, 0], scale: [1, 0.94, 1] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: reduceMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-14 flex max-w-3xl flex-col items-center text-center"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-300/25 bg-teal-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-200">
            <Brain className="h-3.5 w-3.5" /> New on iPhone
          </div>
          <div className="mb-5 flex items-center gap-3">
            <img src="/mindstrike/icon.png" alt="" className="h-12 w-12 rounded-2xl shadow-lg shadow-black/30" />
            <span className="text-2xl font-bold">Mindstrike</span>
          </div>
          <h2 id="mindstrike-showcase-title" className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Ready, set. <span className="bg-gradient-to-r from-teal-300 via-emerald-200 to-amber-200 bg-clip-text text-transparent">Outthink.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-teal-50/75 sm:text-lg">
            90-second maths duels, timed solo practice, seven leagues to climb and six themes to make the arena feel like you.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button size="lg" className="bg-teal-300 text-slate-950 shadow-xl shadow-teal-500/20 hover:bg-teal-200" asChild>
              <a href={APPS.mindstrike.iosUrl} target="_blank" rel="noopener noreferrer">
                Download on the App Store <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" asChild>
              <a href={APPS.mindstrike.siteUrl}>Learn more</a>
            </Button>
          </div>
        </motion.div>

        <ul
          className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 md:mx-auto md:grid md:max-w-6xl md:grid-cols-4 md:overflow-visible md:px-0"
          aria-label="Mindstrike screenshots"
        >
          {screenshots.map((shot, index) => (
            <motion.li
              key={shot.src}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              whileHover={reduceMotion ? undefined : { y: -8 }}
              transition={{ delay: reduceMotion ? 0 : index * 0.1, duration: reduceMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-[70%] shrink-0 snap-center sm:w-[42%] md:w-auto"
            >
              <figure className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/5 p-1.5 shadow-2xl shadow-black/40">
                <img
                  src={shot.src}
                  alt={shot.alt}
                  width={720}
                  height={1564}
                  loading="lazy"
                  className="h-auto w-full rounded-[1.4rem]"
                />
                <figcaption className="sr-only">{shot.title}</figcaption>
              </figure>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
