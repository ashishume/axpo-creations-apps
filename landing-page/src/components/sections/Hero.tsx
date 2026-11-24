import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";
import { APPS, CONTACT_EMAIL } from "@/lib/constants";

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

/** Apps featured in the hero. Each links to its card in the catalogue (Features). */
const heroApps = [
  {
    id: "tracker",
    name: APPS.tracker.name,
    tagline: "Expenses, splits & lending",
    platforms: "Android & iOS",
    iconSrc: "/axpo-mark.png",
    screenSrc: "/assets/hero/axpo-expenses.jpg",
    screenAlt: "Axpo Money expense activity with monthly spending, savings and recent transactions",
    ring: "hover:border-violet-300/40",
  },
  {
    id: "fitness",
    name: APPS.fitness.name,
    tagline: "AI workouts & meal plans",
    platforms: "Android & iOS",
    iconSrc: "/axpo-fitness-icon.png",
    screenSrc: "/assets/hero/axpo-fitness-home.jpg",
    screenAlt: "Axpo Fitness home screen with today's workout, meal scan and daily macros",
    ring: "hover:border-emerald-300/40",
  },
  {
    id: "mindstrike",
    name: APPS.mindstrike.name,
    tagline: "90-second maths duels",
    platforms: "iPhone",
    iconSrc: "/mindstrike/icon.png",
    screenSrc: "/assets/hero/mindstrike-arena.jpg",
    screenAlt: "Mindstrike Arena screen with the ranked duel and a quick maths warm-up",
    ring: "hover:border-teal-300/40",
  },
  {
    id: "collagemagik",
    name: APPS.collagemagik.name,
    tagline: "Photo & video collages",
    platforms: "iPhone",
    iconSrc: "/collagemagik/icon.png",
    screenSrc: "/assets/hero/collagemagik-collage.jpg",
    screenAlt: "CollageMagik editor with photos and video clips in one collage",
    ring: "hover:border-fuchsia-300/40",
  },
] as const;

type Slot = "left" | "center" | "right";

/** Where each slot sits, relative to the centred front phone (x is a share of the phone's own width). */
const SLOT_POSES: Record<Slot, { x: string; y: number; scale: number; rotate: number }> = {
  center: { x: "0%", y: 0, scale: 1, rotate: 0 },
  left: { x: "-54%", y: 48, scale: 0.85, rotate: -8 },
  right: { x: "54%", y: 48, scale: 0.85, rotate: 8 },
};

function PhoneFrame({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`rounded-[2.4rem] border border-white/15 bg-slate-900 p-2 shadow-2xl shadow-black/50 ${className ?? ""}`}>
      <img
        src={src}
        alt={alt}
        width={600}
        height={1304}
        className="h-auto w-full rounded-[1.9rem]"
      />
    </div>
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();
  const [axpo, fitness, , collagemagik] = heroApps;
  const heroPhones = [
    { ...axpo, float: -10, shadow: "" },
    { ...fitness, float: -8, shadow: "shadow-emerald-950/60" },
    { ...collagemagik, float: 10, shadow: "" },
  ];
  const [slots, setSlots] = useState<Record<string, Slot>>({
    [axpo.id]: "left",
    [fitness.id]: "center",
    [collagemagik.id]: "right",
  });

  /** Swap the clicked phone with whichever one is in front. */
  const bringToFront = (id: string) => {
    setSlots((current) => {
      const clicked = current[id];
      if (clicked === "center") return current;
      const frontId = Object.keys(current).find((key) => current[key] === "center")!;
      return { ...current, [id]: "center", [frontId]: clicked };
    });
  };

  return (
    <section className="relative overflow-clip bg-slate-950 pb-20 pt-28 text-white lg:pb-24 lg:pt-32">
      {/* Midnight aurora background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_#312e81_0%,_#0f172a_42%,_#020617_100%)]" aria-hidden />

        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden opacity-[0.14] mix-blend-screen">
          <img
            src={heroBg}
            alt=""
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
          className="absolute -right-20 top-28 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl"
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

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <motion.div
            variants={heroContainer}
            initial={reduceMotion ? false : "hidden"}
            animate="show"
            className="text-center lg:text-left"
          >
            <motion.span
              variants={heroItem}
              className="mb-6 inline-block rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1 text-sm font-semibold text-violet-200 shadow-[0_0_28px_rgba(167,139,250,0.18)]"
            >
              AxpoCreation • Apps for iPhone & Android
            </motion.span>
            <motion.h1 variants={heroItem} className="mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-6xl">
              Apps for your money, body,{" "}
              <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-teal-300 bg-clip-text text-transparent">mind and memories</span>
            </motion.h1>
            <motion.p variants={heroItem} className="mx-auto mb-8 max-w-xl text-lg leading-relaxed text-slate-300 md:text-xl lg:mx-0">
              Track and split every expense with Axpo Money, train and eat smarter with Axpo Fitness, sharpen your maths in Mindstrike duels, and turn photos and videos into collages that move with CollageMagik. Simple, thoughtful apps for every day.
            </motion.p>

            <motion.div variants={heroItem} className="flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
              <motion.div
                className="w-full sm:w-auto"
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.03 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              >
                <Button size="lg" className="h-12 w-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 text-base shadow-lg shadow-violet-500/25 transition-shadow hover:shadow-violet-500/40" asChild>
                  <a href="#apps">
                    Explore our apps
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </motion.div>
              <motion.div
                className="w-full sm:w-auto"
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.03 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              >
                <Button size="lg" variant="outline" className="h-12 w-full border-white/20 bg-white/5 px-8 text-base text-white backdrop-blur-sm hover:bg-white/10 hover:text-white" asChild>
                  <a href={`mailto:${CONTACT_EMAIL}`}>
                    Contact Us
                  </a>
                </Button>
              </motion.div>
            </motion.div>

            {/* App shortcuts */}
            <motion.ul variants={heroItem} className="mx-auto mt-10 grid max-w-2xl gap-3 sm:grid-cols-2 md:grid-cols-4 lg:mx-0">
              {heroApps.map((app) => (
                <li key={app.id}>
                  <motion.a
                    href={`#app-${app.id}`}
                    whileHover={reduceMotion ? undefined : { y: -3 }}
                    className={`group flex h-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-left backdrop-blur-md transition-colors hover:bg-white/10 sm:flex-col sm:items-start ${app.ring}`}
                  >
                    <img src={app.iconSrc} alt="" className="h-11 w-11 shrink-0 rounded-xl object-contain" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-white">{app.name}</span>
                      <span className="block text-xs text-slate-300">{app.tagline}</span>
                      <span className="block text-[11px] text-slate-500">{app.platforms}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 sm:hidden" />
                  </motion.a>
                </li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Phone showcase */}
          <div className="relative mx-auto h-[420px] w-full max-w-[440px] sm:h-[520px] lg:h-[560px]" aria-label="App previews" role="group">
            <div aria-hidden="true" className="absolute inset-10 rounded-full bg-gradient-to-br from-violet-500/30 via-fuchsia-500/10 to-teal-400/30 blur-3xl" />
            {heroPhones.map((phone, index) => {
              const slot = slots[phone.id];
              const pose = SLOT_POSES[slot];
              const isFront = slot === "center";
              return (
                <motion.button
                  key={phone.id}
                  type="button"
                  onClick={() => bringToFront(phone.id)}
                  aria-label={isFront ? `${phone.name} preview` : `Bring ${phone.name} preview to the front`}
                  aria-pressed={isFront}
                  initial={reduceMotion ? false : { opacity: 0, ...pose, y: pose.y + 30 }}
                  animate={{ opacity: 1, ...pose }}
                  whileHover={reduceMotion || isFront ? undefined : { scale: pose.scale + 0.03 }}
                  transition={{
                    opacity: { delay: reduceMotion ? 0 : 0.3 + index * 0.12, duration: reduceMotion ? 0 : 0.7 },
                    default: { type: "spring", stiffness: 170, damping: 22, duration: reduceMotion ? 0 : undefined },
                  }}
                  style={{ zIndex: isFront ? 10 : 1 }}
                  className={`absolute left-[24%] top-0 w-[52%] rounded-[2.4rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${isFront ? "cursor-default" : "cursor-pointer"}`}
                >
                  <motion.div
                    animate={reduceMotion ? undefined : { y: [0, phone.float, 0] }}
                    transition={{ duration: 6 + index * 0.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <PhoneFrame src={phone.screenSrc} alt={phone.screenAlt} className={phone.shadow} />
                  </motion.div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
