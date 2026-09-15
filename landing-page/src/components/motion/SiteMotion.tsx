import { AnimatePresence, motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import type { ReactNode } from "react";

type SiteMotionProps = {
  children: ReactNode;
  routeKey: string;
};

export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    mass: 0.25,
  });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-[70] h-1 origin-left bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_18px_hsl(var(--primary)/0.55)]"
      style={{ scaleX: reduceMotion ? scrollYProgress : scaleX }}
    />
  );
}

export function SiteMotion({ children, routeKey }: SiteMotionProps) {
  const reduceMotion = useReducedMotion();

  return (
    <>
      <ScrollProgress />
      <AnimatePresence initial={!reduceMotion} mode="wait">
        <motion.div
          key={routeKey}
          className="min-h-screen"
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.32, ease: "easeOut" }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {!reduceMotion && (
        <motion.div
          key={`sweep-${routeKey}`}
          aria-hidden="true"
          className="pointer-events-none fixed inset-y-0 left-0 z-40 w-1/3 bg-gradient-to-r from-transparent via-primary/8 to-transparent blur-2xl"
          initial={{ x: "-150%", opacity: 0 }}
          animate={{ x: "400%", opacity: [0, 0.75, 0] }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </>
  );
}
