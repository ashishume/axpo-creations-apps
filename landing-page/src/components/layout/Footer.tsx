import { Rocket, Mail, MapPin, Phone, Facebook, Instagram } from "lucide-react";
import { Link } from "wouter";
import { APPS } from "@/lib/constants";
import { motion, useReducedMotion } from "framer-motion";

export function Footer() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.footer
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="bg-slate-950 text-slate-300 pt-16 pb-8 overflow-hidden"
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduceMotion ? 0 : 0.08 }}
            className="space-y-4"
          >
            <div className="flex items-center gap-2 font-heading font-bold text-2xl text-white">
              <motion.span
                className="inline-flex"
                whileHover={reduceMotion ? undefined : { rotate: -12, y: -3 }}
                transition={{ type: "spring", stiffness: 320, damping: 12 }}
              >
                <Rocket className="w-6 h-6 text-primary" />
              </motion.span>
              Axpo<span className="text-slate-100">Creation</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Smart expense tracking, shared splits, and lending insights in one mobile app.
            </p>
            <div className="flex gap-4 pt-2">
              <motion.a
                href="https://www.facebook.com/profile.php?id=61574354923904"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="AxpoCreation on Facebook"
                className="hover:text-primary transition-colors"
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.12 }}
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
              >
                <Facebook className="w-5 h-5" />
              </motion.a>
              <motion.a
                href="https://www.instagram.com/aaxpocreation"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="AxpoCreation on Instagram"
                className="hover:text-primary transition-colors"
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.12 }}
                whileTap={reduceMotion ? undefined : { scale: 0.94 }}
              >
                <Instagram className="w-5 h-5" />
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduceMotion ? 0 : 0.14 }}
          >
            <h3 className="font-bold text-white mb-4">AXPO</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/expense-tracker-app" className="hover:text-primary transition-colors cursor-pointer">{APPS.tracker.name}</Link></li>
              <li><a href="/figureout" className="hover:text-primary transition-colors">Figureout — The game night</a></li>
              <li><a href="/figureout/support" className="hover:text-primary transition-colors">Figureout support & legal</a></li>
            </ul>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduceMotion ? 0 : 0.2 }}
          >
            <h3 className="font-bold text-white mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-primary transition-colors cursor-pointer">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">Careers</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors cursor-pointer">Contact</Link></li>
              <li><Link href="/privacy-policy" className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</Link></li>
              <li><Link href="/terms-of-service" className="hover:text-primary transition-colors cursor-pointer">Terms of Service</Link></li>
              <li><Link href="/copyright" className="hover:text-primary transition-colors cursor-pointer">Copyright</Link></li>
              <li><Link href="/delete-account" className="hover:text-primary transition-colors cursor-pointer">Delete Account</Link></li>
            </ul>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduceMotion ? 0 : 0.26 }}
          >
            <h3 className="font-bold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>Bengaluru, Karnataka</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span>8557098095</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>ashishume@gmail.com</span>
              </li>
            </ul>
          </motion.div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} AxpoCreation. All rights reserved.</p>
        </div>
      </div>
    </motion.footer>
  );
}
