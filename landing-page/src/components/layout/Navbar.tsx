import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const reduceMotion = useReducedMotion();

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Apps", href: "/products" },
    { name: "Axpo Money", href: "/expense-tracker-app" },
    { name: "Fitness", href: "/axpo-fitness" },
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <motion.nav
      initial={reduceMotion ? false : { opacity: 0, y: -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="fixed w-full top-0 z-50 bg-slate-950/75 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_30px_rgba(2,6,23,0.35)]"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-heading font-bold text-2xl text-white hover:opacity-90 transition-opacity cursor-pointer">
          <motion.span
            className="inline-flex"
            whileHover={reduceMotion ? undefined : { rotate: -12, scale: 1.12 }}
            transition={{ type: "spring", stiffness: 350, damping: 14 }}
          >
            <img src="/axpo-creation-mark.png" alt="" width={32} height={31} className="h-8 w-auto" />
          </motion.span>
            Axpo<span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">Creation</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <motion.div
              key={link.href}
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.96 }}
            >
              <Link
                href={link.href}
                className={cn(
                  "relative py-5 text-sm font-medium transition-colors hover:text-white cursor-pointer",
                  "after:absolute after:inset-x-0 after:bottom-3.5 after:h-0.5 after:origin-left after:rounded-full after:bg-gradient-to-r after:from-violet-400 after:to-indigo-400 after:transition-transform after:duration-300",
                  location === link.href
                    ? "text-white font-semibold after:scale-x-100"
                    : "text-slate-400 after:scale-x-0 hover:after:scale-x-100"
                )}
              >
                {link.name}
              </Link>
            </motion.div>
          ))}
          <motion.div
            whileHover={reduceMotion ? undefined : { y: -2, scale: 1.02 }}
            whileTap={reduceMotion ? undefined : { scale: 0.97 }}
          >
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold text-white shadow-lg shadow-violet-500/25 transition-shadow hover:shadow-violet-500/40" asChild>
              <Link href="/products">Get our apps</Link>
            </Button>
          </motion.div>
        </div>

        {/* Mobile Nav Toggle */}
        <button
          type="button"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          className="md:hidden p-2 text-slate-300 hover:text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isOpen ? "close" : "menu"}
              className="block"
              initial={reduceMotion ? false : { opacity: 0, rotate: -30, scale: 0.75 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, rotate: 30, scale: 0.75 }}
              transition={{ duration: reduceMotion ? 0 : 0.16 }}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -14, scaleY: 0.94 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -10, scaleY: 0.96 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden absolute top-16 left-0 w-full origin-top bg-slate-950 border-b border-white/10 p-4 flex flex-col gap-2 shadow-xl"
          >
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: reduceMotion ? 0 : 0.04 + index * 0.045 }}
              >
                <Link
                  href={link.href}
                  className={cn(
                    "block text-base font-medium p-3 rounded-md hover:bg-white/5 transition-colors cursor-pointer",
                    location === link.href ? "text-white bg-violet-500/15" : "text-slate-300"
                  )}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.22 }}
            >
              <Button className="w-full mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25" asChild>
                <Link href="/products" onClick={() => setIsOpen(false)}>Get our apps</Link>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
