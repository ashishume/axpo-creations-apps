import { Rocket, Mail, MapPin, Phone, Linkedin, Twitter, Facebook } from "lucide-react";
import { Link } from "wouter";
import { APPS } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-heading font-bold text-2xl text-white">
              <Rocket className="w-6 h-6 text-primary" />
              Axpo<span className="text-slate-100">Creation</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              AI-powered software for billing, inventory, and school finance—built for reliability and growth.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:text-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-primary transition-colors"><Facebook className="w-5 h-5" /></a>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white mb-4">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-primary transition-colors cursor-pointer">{APPS.biller.name}</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors cursor-pointer">{APPS.eduFinance.name}</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors cursor-pointer">{APPS.tracker.name}</Link></li>
              <li><Link href="/products" className="hover:text-primary transition-colors cursor-pointer">Custom Solutions</Link></li>
            </ul>
          </div>

          <div>
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
          </div>

          <div>
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
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 text-center text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} AxpoCreation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
