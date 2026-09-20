import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink, Smartphone } from "lucide-react";
import { APPS } from "@/lib/constants";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-5 py-10 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.2),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.18),transparent_42%)]" />

      <section className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.06] p-7 text-center shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
        <img
          src="/axpo-logo.png"
          alt="AXPO"
          className="mx-auto mb-6 h-24 w-24 rounded-3xl border border-white/10 object-cover shadow-xl shadow-teal-500/10"
        />

        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-teal-300">
          AXPO
        </p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {isRedirecting ? `Opening ${storeName}` : "Get the app"}
        </h1>
        <p className="mx-auto mt-4 max-w-md leading-relaxed text-slate-300">
          {isRedirecting
            ? `You’ll be redirected to ${storeName} automatically.`
            : "Choose your device to download the app and start managing expenses, splits, and lending in one place."}
        </p>

        {isRedirecting ? (
          <div className="mt-8">
            <div className="mx-auto mb-5 h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-teal-400" />
            <a
              href={destination}
              className="inline-flex items-center gap-2 font-semibold text-teal-300 transition-colors hover:text-teal-200"
            >
              Continue to {storeName}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        ) : (
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a
              href={APPS.tracker.iosUrl}
              className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 font-semibold text-slate-950 transition-transform hover:-translate-y-0.5"
            >
              App Store
              <ExternalLink
                className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
            <a
              href={APPS.tracker.androidUrl}
              className="group inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 py-4 font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-white/15"
            >
              Google Play
              <ExternalLink
                className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </a>
          </div>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Smartphone className="h-4 w-4" aria-hidden="true" />
          Available for iOS and Android
        </div>
      </section>
    </main>
  );
}
