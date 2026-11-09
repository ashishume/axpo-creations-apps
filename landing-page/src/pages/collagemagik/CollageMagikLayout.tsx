import { useEffect, type ReactNode } from "react";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { A, B, H2, List, Mail, P, SUPPORT_EMAIL } from "../axpo-fitness/LegalLayout";

export { A, B, H2, List, Mail, P, SUPPORT_EMAIL };

export const APP_NAME = "CollageMagik";
export const EFFECTIVE_DATE = "November 9, 2026";
export const SITE_ORIGIN = "https://www.axpocreation.com";
export const BASE = "/collagemagik";

/** Sets the tab title, description and canonical URL for a page, and puts them back when the page unmounts. */
export function usePageMeta(title: string, description: string, path: string) {
  useEffect(() => {
    const previousTitle = document.title;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.getAttribute("content") ?? null;
    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const created = canonical === null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    const previousCanonical = canonical.getAttribute("href");

    document.title = title;
    meta?.setAttribute("content", description);
    canonical.href = `${SITE_ORIGIN}${path}`;

    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== null) meta.setAttribute("content", previousDescription);
      if (created) canonical?.remove();
      else if (previousCanonical !== null && canonical) canonical.href = previousCanonical;
    };
  }, [title, description, path]);
}

const navLink = "text-indigo-500 dark:text-indigo-400 hover:underline";

/** Shared frame for the CollageMagik legal and support pages (the iPhone app and the App Store listing link to these URLs). */
export function LegalPage({
  title,
  intro,
  path,
  children,
}: {
  title: string;
  intro?: ReactNode;
  path: string;
  children: ReactNode;
}) {
  usePageMeta(`${title} | ${APP_NAME}`, `${title} for ${APP_NAME}, the photo and video collage maker for iPhone by AxpoCreation.`, path);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-[720px] mx-auto px-4 pt-24 pb-8">
          <Link href={BASE} className={`inline-block mb-6 ${navLink}`}>
            ← {APP_NAME}
          </Link>
          <h1 className="text-2xl font-semibold mb-2 dark:text-slate-200 text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Effective date: {EFFECTIVE_DATE}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Developer: Ashish Debnath (AxpoCreation) · Contact: <Mail />
          </p>
          {intro && <P>{intro}</P>}
          {children}
          <nav
            aria-label={`${APP_NAME} pages`}
            className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-wrap gap-x-6 gap-y-2 text-sm"
          >
            <Link href={`${BASE}/privacy-policy`} className={navLink}>Privacy Policy</Link>
            <Link href={`${BASE}/terms-of-service`} className={navLink}>Terms of Use</Link>
            <Link href={`${BASE}/account-deletion`} className={navLink}>Delete your data</Link>
            <Link href={`${BASE}/support`} className={navLink}>Support</Link>
          </nav>
        </div>
      </main>
      <Footer />
    </div>
  );
}
