import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { APPS } from "@/lib/constants";

const PAGE_TITLE = "Axpo Expense Tracker App | Pocket Friendly Expense Assistant";
const PAGE_DESCRIPTION = "Pocket friendly expenses assistant or manager";
const PAGE_URL = "https://www.axpocreation.com/expense-tracker-app";
const LOGO_URL = "https://www.axpocreation.com/expense-tracker-logo.png";

function setMetaTag(
  key: string,
  content: string,
  attr: "name" | "property" = "name"
): () => void {
  const selector = `meta[${attr}="${key}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  const previous = tag.getAttribute("content");
  tag.setAttribute("content", content);

  return () => {
    if (previous !== null) {
      tag?.setAttribute("content", previous);
    } else {
      tag?.remove();
    }
  };
}

function setCanonical(href: string): () => void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  const previous = link.getAttribute("href");
  link.setAttribute("href", href);

  return () => {
    if (previous !== null) {
      link?.setAttribute("href", previous);
    } else {
      link?.remove();
    }
  };
}

function setJsonLd(data: object): () => void {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.text = JSON.stringify(data);
  document.head.appendChild(script);

  return () => script.remove();
}

export default function ExpenseTrackerApp() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = PAGE_TITLE;

    const cleanup = [
      () => {
        document.title = previousTitle;
      },
      setMetaTag("description", PAGE_DESCRIPTION),
      setMetaTag("keywords", "expense tracker app, expense manager app, personal budget app, pocket friendly expense assistant"),
      setMetaTag("robots", "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"),
      setMetaTag("author", "AxpoCreation"),
      setMetaTag("og:title", PAGE_TITLE, "property"),
      setMetaTag("og:description", PAGE_DESCRIPTION, "property"),
      setMetaTag("og:type", "website", "property"),
      setMetaTag("og:url", PAGE_URL, "property"),
      setMetaTag("og:image", LOGO_URL, "property"),
      setMetaTag("twitter:card", "summary_large_image"),
      setMetaTag("twitter:title", PAGE_TITLE),
      setMetaTag("twitter:description", PAGE_DESCRIPTION),
      setMetaTag("twitter:image", LOGO_URL),
      setCanonical(PAGE_URL),
      setJsonLd({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Axpo Expense Tracker App",
        applicationCategory: "FinanceApplication",
        operatingSystem: "Android, iOS",
        description: PAGE_DESCRIPTION,
        url: PAGE_URL,
        image: LOGO_URL,
      }),
    ];

    return () => cleanup.forEach((restore) => restore());
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <section className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl rounded-3xl bg-white shadow-xl shadow-slate-200/80 p-6 md:p-10 border border-slate-100">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700 mb-4">
                  Expense Tracker App
                </p>
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 leading-tight">
                  Pocket friendly expenses assistant or manager
                </h1>
                <p className="mt-5 text-slate-600 text-lg leading-relaxed">
                  Track daily spending, organize group splits, and stay on top of personal lending in one simple app.
                  Axpo Expense Manager is designed for everyday users who want clean records, quick entries, and
                  smarter money decisions without complex setup.
                </p>
                <div className="mt-8 flex flex-wrap gap-3 text-sm">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">Daily expense logs</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">Smart group split tracking</span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">Lend and borrow records</span>
                </div>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <a
                    href={APPS.tracker.iosUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                  >
                    Download on App Store
                  </a>
                  <a
                    href={APPS.tracker.androidUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                  >
                    Get it on Google Play
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  src="/expense-tracker-logo.png"
                  alt="Axpo Expense Tracker app logo"
                  className="w-full max-w-sm rounded-3xl border border-slate-200 shadow-2xl shadow-slate-300/40"
                  loading="eager"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="container mx-auto px-4 mt-10">
          <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 md:p-8">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-slate-900 mb-4">
              Why users choose Axpo Expense Manager
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              Whether you are managing personal monthly budgets, tracking shared trips with friends, or handling
              lend and borrow records, the app keeps everything organized in one place. You can add expenses quickly,
              categorize spending, review trends, and maintain clarity across individual and group money activity.
            </p>
            <p className="text-slate-600 leading-relaxed mb-6">
              The app experience is built for speed and simplicity: voice and manual entry support, clean summaries,
              searchable records, and sync across supported mobile platforms. This makes it useful for students,
              working professionals, families, and small teams who need a pocket friendly expense assistant or manager.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="font-semibold text-slate-800 mb-1">Personal Budget Control</p>
                <p className="text-slate-600">Understand where money goes with category-wise and month-wise tracking.</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="font-semibold text-slate-800 mb-1">Group Split Transparency</p>
                <p className="text-slate-600">Track balances, settlements, and history for shared expenses.</p>
              </div>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <p className="font-semibold text-slate-800 mb-1">Lending Record Clarity</p>
                <p className="text-slate-600">Keep due dates and lending records organized with less manual effort.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
