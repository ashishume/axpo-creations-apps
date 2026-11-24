import { motion, useReducedMotion } from "framer-motion";
import { Link } from "wouter";
import { ArrowRight, Images, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APPS } from "@/lib/constants";

const screenshots = [
  {
    src: "/assets/collagemagik/01-photos-and-videos.jpg",
    title: "Photos + videos. One collage.",
    alt: "CollageMagik collage editor with photos and video clips playing in the same layout",
  },
  {
    src: "/assets/collagemagik/02-photos-that-flow.jpg",
    title: "Photos that flow. Slide to slide.",
    alt: "CollageMagik carousel where one photo runs across the edge onto the next slide",
  },
  {
    src: "/assets/collagemagik/04-captions-and-stickers.jpg",
    title: "Captions & stickers.",
    alt: "CollageMagik collage with lettering styles, captions and emoji stickers",
  },
  {
    src: "/assets/collagemagik/10-export-4k-60fps.jpg",
    title: "Export in 4K at 60 fps.",
    alt: "CollageMagik export sheet with MP4 video in 4K at 60 frames per second",
  },
] as const;

export function CollageMagikShowcase() {
  const reduceMotion = useReducedMotion();
  const iosUrl = APPS.collagemagik.iosUrl;

  return (
    <section
      aria-labelledby="collagemagik-showcase-title"
      className="relative overflow-hidden bg-[#150d2e] py-24 text-white"
    >
      <motion.div
        aria-hidden="true"
        className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl"
        animate={reduceMotion ? undefined : { x: [0, 40, 0], y: [0, -20, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-pink-500/15 blur-3xl"
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
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
            <Images className="h-3.5 w-3.5" /> New on iPhone
          </div>
          <div className="mb-5 flex items-center gap-3">
            <img src="/collagemagik/icon.png" alt="" className="h-12 w-12 rounded-2xl shadow-lg shadow-black/30" />
            <span className="text-2xl font-bold">{APPS.collagemagik.name}</span>
          </div>
          <h2 id="collagemagik-showcase-title" className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Collages that{" "}
            <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-pink-200 bg-clip-text text-transparent">move.</span>
          </h2>
          <p className="mt-5 max-w-xl text-base leading-7 text-violet-50/75 sm:text-lg">
            Mix photos and videos in one frame, or build a carousel whose pictures flow across slides. Add captions, stickers and your own song, then export in up to 4K at 60 fps. No account, and your photos never leave your iPhone.
          </p>
          <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            {iosUrl ? (
              <Button size="lg" className="bg-violet-500 text-white shadow-xl shadow-violet-500/25 hover:bg-violet-400" asChild>
                <a href={iosUrl} target="_blank" rel="noopener noreferrer">
                  Download on the App Store <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            ) : (
              <span className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-violet-300/25 bg-violet-300/10 px-8 text-sm font-medium text-violet-100">
                <Sparkles className="h-4 w-4" /> Coming soon to the App Store
              </span>
            )}
            <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" asChild>
              <Link href={APPS.collagemagik.siteUrl}>Learn more</Link>
            </Button>
          </div>
        </motion.div>

        <ul
          className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-4 md:mx-auto md:grid md:max-w-6xl md:grid-cols-4 md:overflow-visible md:px-0"
          aria-label="CollageMagik screenshots"
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
                  height={1565}
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
