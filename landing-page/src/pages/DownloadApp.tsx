import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink, Smartphone } from "lucide-react";
import { APPS } from "@/lib/constants";
import { AxpoMark } from "@/components/axpo/AxpoMark";
import {
  detectMobilePlatform,
  type MobilePlatform,
} from "@/lib/mobilePlatform";

const PAGE_TITLE = "Download AXPO";
const PAGE_DESCRIPTION =
  "Track spending, split bills, and manage lending with AXPO. Available on iOS and Android.";
const PAGE_URL = "https://www.axpocreation.com/axpo";

function destinationFor(platform: MobilePlatform): string | null {
  if (platform === "ios") return APPS.tracker.iosUrl;
  if (platform === "android") return APPS.tracker.androidUrl;
  return null;
}

export default function DownloadApp() {
  const [platform] = useState<MobilePlatform>(() =>
    typeof navigator === "undefined" ? "other" : detectMobilePlatform(navigator)
  );
  const destination = destinationFor(platform);

  useEffect(() => {
    const previousTitle = document.title;
    const description = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]'
    );
    const previousDescription = description?.content;
    let canonical = document.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]'
    );
    const createdCanonical = canonical === null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    const previousCanonical = canonical.getAttribute("href");

    document.title = PAGE_TITLE;
    description?.setAttribute("content", PAGE_DESCRIPTION);
    canonical.href = PAGE_URL;

    return () => {
      document.title = previousTitle;
      if (description && previousDescription !== undefined) {
        description.content = previousDescription;
      }
      if (createdCanonical) {
        canonical.remove();
      } else if (previousCanonical !== null) {
        canonical.href = previousCanonical;
      }
    };
  }, []);

  useEffect(() => {
    if (destination) {
      window.location.replace(destination);
    }
  }, [destination]);

  const isRedirecting = destination !== null;
  const storeName = platform === "ios" ? "App Store" : "Google Play";

  return (
    <main className="theme-axpo theme-axpo-system relative flex min-h-screen items-center justify-center overflow-hidden bg-axpo-background px-5 py-10 text-axpo-text">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--axpo-accent)_12%,transparent),transparent_60%)]"
      />

      <section className="relative w-full max-w-md text-center">
        <div className="mb-10 flex items-center justify-center gap-3">
          <AxpoMark followSystem alt="" className="h-11 w-11" />
          <span className="font-rounded text-lg font-bold">Axpo Expense</span>
        </div>

        <p className="mb-3 font-rounded text-xs font-bold uppercase tracking-[0.2em] text-axpo-accent">
          A little clarity. Every day.
        </p>
        <h1 className="font-rounded text-4xl font-bold tracking-tight sm:text-[2.6rem] sm:leading-[1.1]">
          {isRedirecting ? (
            <>
              Opening <span className="block text-axpo-accent">{storeName}</span>
            </>
          ) : (
            <>
              Your money,
              <span className="block text-axpo-accent">in a good place.</span>
            </>
          )}
        </h1>
        <p className="mx-auto mt-4 max-w-sm leading-relaxed text-axpo-secondary-text">
          {isRedirecting
            ? `You’ll be redirected to ${storeName} automatically.`
            : "Little spends. Shared plans. Bring it all together with Axpo."}
        </p>

        {isRedirecting ? (
          <div className="mt-10">
            <div className="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-4 border-axpo-secondary-surface border-t-axpo-accent" />
            <a
              href={destination}
              className="inline-flex min-h-11 items-center gap-2 font-semibold text-axpo-accent hover:underline"
            >
              Continue to {storeName}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        ) : (
          <div className="mt-10 flex flex-col gap-3">
            <a
              href={APPS.tracker.iosUrl}
              className="group inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl bg-axpo-accent px-5 font-semibold text-axpo-on-accent shadow-lg shadow-axpo-hero-start/15 transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Download on the App Store
              <ExternalLink
                className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
            <a
              href={APPS.tracker.androidUrl}
              className="group inline-flex min-h-[54px] items-center justify-center gap-2 rounded-2xl border border-axpo-border bg-axpo-surface px-5 font-semibold text-axpo-text transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              Get it on Google Play
              <ExternalLink
                className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-axpo-secondary-text">
          <Smartphone className="h-4 w-4" aria-hidden="true" />
          Available for iOS and Android
        </div>
      </section>
    </main>
  );
}
