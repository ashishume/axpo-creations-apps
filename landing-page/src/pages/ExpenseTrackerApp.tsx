import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { APPS } from "@/lib/constants";
import { AxpoMark } from "@/components/axpo/AxpoMark";
import { ChartPie, HandCoins, Users } from "lucide-react";

const PAGE_TITLE = "AXPO | Smart Money, Simplified";
const PAGE_DESCRIPTION =
  "Track spending, split bills, and manage lending with AXPO.";
const PAGE_URL = "https://www.axpocreation.com/expense-tracker-app";
const LOGO_URL = "https://www.axpocreation.com/axpo-logo.png";

// Tones match the native category/status accents.
const HIGHLIGHTS = [
  {
    title: "Personal Budget Control",
    detail: "Understand where money goes with category-wise and month-wise tracking.",
    Icon: ChartPie,
    tone: "--axpo-accent",
  },
  {
    title: "Group Split Transparency",
    detail: "Track balances, settlements, and history for shared expenses.",
    Icon: Users,
    tone: "--axpo-cool",
  },
  {
    title: "Lending Record Clarity",
    detail: "Keep due dates and lending records organized with less manual effort.",
    Icon: HandCoins,
    tone: "--axpo-positive",
  },
];

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
      setMetaTag("keywords", "AXPO, personal budget app, expense tracking, bill splitting, pocket friendly expense assistant"),
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
        name: "AXPO",
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
    <div className="theme-axpo min-h-screen flex flex-col bg-axpo-background text-axpo-text">
      <Navbar />
      <main className="flex-grow pt-24 pb-16">
        <section className="container mx-auto px-4">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-gradient-to-br from-axpo-hero-start to-axpo-hero-end p-6 text-white shadow-2xl shadow-axpo-hero-start/25 md:p-10">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/[0.06]"
            />
            <div className="relative grid md:grid-cols-[1.2fr_1fr] gap-10 items-center">
              <div>
                <p className="mb-4 font-rounded text-xs font-bold uppercase tracking-[0.2em] text-white/75">
                  A little clarity. Every day.
                </p>
                <h1 className="font-rounded text-4xl md:text-5xl font-bold leading-[1.08] tracking-tight">
                  Your money,
                  <span className="block text-[#D1B7F5]">in a good place.</span>
                </h1>
                <p className="mt-5 text-lg leading-relaxed text-white/80">
                  Track daily spending, organize group splits, and stay on top of personal lending in one simple app.
                  AXPO is designed for everyday users who want clean records, quick entries, and
                  smarter money decisions without complex setup.
                </p>
                <div className="mt-7 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-white/12 px-3 py-1.5 font-medium text-white">Daily expense logs</span>
                  <span className="rounded-full bg-white/12 px-3 py-1.5 font-medium text-white">Smart group split tracking</span>
                  <span className="rounded-full bg-white/12 px-3 py-1.5 font-medium text-white">Lend and borrow records</span>
                </div>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  <a
                    href={APPS.tracker.iosUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[54px] items-center justify-center rounded-2xl bg-white px-4 text-sm font-semibold text-axpo-hero-start transition-transform hover:-translate-y-0.5"
                  >
                    Download on App Store
                  </a>
                  <a
                    href={APPS.tracker.androidUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[54px] items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                  >
                    Get it on Google Play
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <AxpoMark
                  alt="AXPO logo"
                  loading="eager"
                  className="w-full max-w-[280px] drop-shadow-[0_24px_40px_rgba(20,8,40,0.35)]"
                />
              </div>
            </div>
          </div>
        </section>
        <section className="container mx-auto px-4 mt-10">
          <div className="mx-auto max-w-5xl rounded-3xl border border-axpo-border bg-axpo-surface p-6 md:p-8">
            <h2 className="font-rounded text-2xl md:text-3xl font-bold text-axpo-text mb-4">
              Why users choose AXPO
            </h2>
            <p className="text-axpo-secondary-text leading-relaxed mb-6">
              Whether you are managing personal monthly budgets, tracking shared trips with friends, or handling
              lend and borrow records, the app keeps everything organized in one place. You can add expenses quickly,
              categorize spending, review trends, and maintain clarity across individual and group money activity.
            </p>
            <p className="text-axpo-secondary-text leading-relaxed mb-6">
              The app experience is built for speed and simplicity: voice and manual entry support, clean summaries,
              searchable records, and sync across supported mobile platforms. This makes it useful for students,
              working professionals, families, and small teams who need a pocket friendly expense assistant or manager.
            </p>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              {HIGHLIGHTS.map(({ title, detail, Icon, tone }) => (
                <div key={title} className="rounded-2xl border border-axpo-border bg-axpo-background p-4">
                  <span
                    className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full"
                    style={{ color: `var(${tone})`, backgroundColor: `color-mix(in srgb, var(${tone}) 12%, transparent)` }}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <p className="font-semibold text-axpo-text mb-1">{title}</p>
                  <p className="text-axpo-secondary-text">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
