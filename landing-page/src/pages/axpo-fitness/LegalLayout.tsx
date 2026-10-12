import type { ReactNode } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const APP_NAME = "AxpoFitness";
export const SUPPORT_EMAIL = "aaxpocreation@gmail.com";
export const WEBSITE_URL = "axpocreation.com";
export const EFFECTIVE_DATE = "October 12, 2026";

/** Shared frame for the AxpoFitness legal and support pages (the apps link to these URLs). */
export function LegalPage({ title, intro, children }: { title: string; intro?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-[720px] mx-auto px-4 py-8">
          <Link href="/" className="inline-block mb-6 text-indigo-500 dark:text-indigo-400 hover:underline">
            ← Back
          </Link>
          <h1 className="text-2xl font-semibold mb-2 dark:text-slate-200 text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Effective date: {EFFECTIVE_DATE}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Developer: Ashish Debnath · Contact: <Mail />
          </p>
          {intro && <P>{intro}</P>}
          {children}
          <nav className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <Link href="/axpo-fitness/privacy-policy" className="text-indigo-500 dark:text-indigo-400 hover:underline">Privacy Policy</Link>
            <Link href="/axpo-fitness/terms-of-service" className="text-indigo-500 dark:text-indigo-400 hover:underline">Terms of Service</Link>
            <Link href="/axpo-fitness/account-deletion" className="text-indigo-500 dark:text-indigo-400 hover:underline">Account deletion</Link>
            <Link href="/axpo-fitness/support" className="text-indigo-500 dark:text-indigo-400 hover:underline">Support</Link>
          </nav>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="text-lg font-medium mt-8 mb-2 dark:text-slate-200 text-slate-900">{children}</h2>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed text-slate-600 dark:text-slate-400 mb-4">{children}</p>;
}

export function List({ ordered, children }: { ordered?: boolean; children: ReactNode }) {
  const className = `${ordered ? "list-decimal" : "list-disc"} pl-5 space-y-2 text-slate-600 dark:text-slate-400 mb-4`;
  return ordered ? <ol className={className}>{children}</ol> : <ul className={className}>{children}</ul>;
}

export function B({ children }: { children: ReactNode }) {
  return <strong className="dark:text-slate-300 text-slate-700">{children}</strong>;
}

export function Mail() {
  return (
    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-indigo-500 dark:text-indigo-400 hover:underline">
      {SUPPORT_EMAIL}
    </a>
  );
}

export function A({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-500 dark:text-indigo-400 hover:underline">
      {children}
    </a>
  );
}
