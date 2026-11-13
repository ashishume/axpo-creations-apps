import { Link } from "wouter";
import {
  ArrowRight,
  Film,
  Grid2x2,
  GalleryHorizontalEnd,
  Lock,
  Music,
  Scissors,
  Share2,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { APPS } from "@/lib/constants";
import { APP_NAME, BASE, usePageMeta } from "./CollageMagikLayout";

const SUBTITLE = "Collage Maker & Editor";

const TITLE = `${APP_NAME}: ${SUBTITLE}`;
const DESCRIPTION =
  "Mix photos and videos that play inside one collage, or design a carousel whose photos flow across slides. 35 layouts, trim clips, add your own music, export in high quality. Free to download with a few ads, no account, and your photos are never uploaded.";

const features: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Film,
    title: "Collages that move",
    body: "Put up to 9 photos and 2 videos in one frame. The videos play right inside their cells.",
  },
  {
    icon: GalleryHorizontalEnd,
    title: "Carousels that connect",
    body: "Spread photos across up to 10 slides so a picture runs over the edge, half on one slide and half on the next. People swipe to see the rest.",
  },
  {
    icon: Grid2x2,
    title: "35 layouts, 3 shapes",
    body: "Pick a layout for your cell count, then set the gap, corners and colour. Story 9:16, Post 4:5 or Square.",
  },
  {
    icon: Scissors,
    title: "Trim, split, crop, straighten",
    body: "Cut clips on a timeline, delay when they start, then crop, flip, rotate and straighten any picture.",
  },
  {
    icon: Music,
    title: "Your own soundtrack",
    body: "Add a song from your Files, trim it, set the volume and fade it out. No built-in music, so no copyright surprises.",
  },
  {
    icon: Share2,
    title: "Export in high quality",
    body: "H.264 MP4 at 1080 × 1920 (or 2160 × 3840 on supported iPhones) or a PNG still. Share it or save it to Photos.",
  },
  {
    icon: Lock,
    title: "Private by design",
    body: "No account or sign-in. Your photos and videos are processed on your iPhone and never uploaded, and never shared with advertisers.",
  },
];

const links = [
  { label: "Privacy Policy", href: `${BASE}/privacy-policy` },
  { label: "Terms of Use", href: `${BASE}/terms-of-service` },
  { label: "Delete your data", href: `${BASE}/account-deletion` },
  { label: "Support", href: `${BASE}/support` },
];

const FACTS = "Free to download · Ads, removable with Pro · No account · iPhone with iOS 26 or later";

/** Opens the app's App Store page; falls back to a "coming soon" label if no link is set. */
function AppStoreButton({ href }: { href: string | null }) {
  if (!href) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950">
        <Sparkles className="h-4 w-4" /> Coming soon to the App Store
      </span>
    );
  }
  return (
    <Button size="lg" className="bg-white text-slate-950 hover:bg-white/90" asChild>
      <a href={href} target="_blank" rel="noopener noreferrer">
        Download on the App Store <ArrowRight className="ml-2 h-4 w-4" />
      </a>
    </Button>
  );
}

export default function CollageMagikLanding() {
  usePageMeta(TITLE, DESCRIPTION, BASE);
  const iosUrl = APPS.collagemagik.iosUrl;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="relative overflow-hidden bg-[#150d2e] pt-28 pb-20 text-white">
          <div aria-hidden="true" className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
          <div aria-hidden="true" className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="container relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-300/25 bg-violet-300/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-violet-200">
              <Smartphone className="h-3.5 w-3.5" /> For iPhone
            </div>
            <img
              src="/collagemagik/icon.png"
              alt={`${APP_NAME} app icon`}
              width={96}
              height={96}
              className="mb-4 h-24 w-24 rounded-[1.4rem] shadow-2xl shadow-black/40"
            />
            <p className="mb-6 text-lg font-semibold text-white">
              {APP_NAME}
              <span className="block text-sm font-medium text-violet-200/80">{SUBTITLE}</span>
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Make a collage that{" "}
              <span className="bg-gradient-to-r from-violet-300 via-pink-300 to-sky-300 bg-clip-text text-transparent">moves.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-violet-50/80 sm:text-lg">
              {APP_NAME} mixes photos and videos in one collage for your Story or post, or turns your photos
              into a carousel that flows across slides so people keep swiping. Trim clips, add your own music and
              export in high quality, all on your iPhone.
            </p>
            <div className="mt-8 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
              <AppStoreButton href={iosUrl} />
              <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white" asChild>
                <Link href={`${BASE}/support`}>Get help</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-violet-100/60">{FACTS}</p>
          </div>
        </section>

        <section aria-labelledby="cm-features" className="bg-slate-50 py-20 dark:bg-slate-900/50">
          <div className="container mx-auto max-w-5xl px-4">
            <h2 id="cm-features" className="mb-12 text-center text-3xl font-bold font-heading">
              Everything you need, nothing you don&apos;t
            </h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <li key={title} className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm">
                  <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-300">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">{body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="cm-privacy" className="py-20">
          <div className="container mx-auto max-w-3xl px-4 text-center">
            <h2 id="cm-privacy" className="mb-4 text-3xl font-bold font-heading">Your pictures stay yours</h2>
            <p className="text-lg leading-8 text-muted-foreground">
              {APP_NAME} has no login and no server for your pictures. Everything you add and everything you export lives on your iPhone.
              Finished collages are kept in <strong>My Library</strong> inside the app, and you can delete them, or
              everything, whenever you like. The app is free and shows an occasional ad from Meta Audience Network after you
              export. Ads never get your pictures, and you choose whether they can be personalised.
            </p>
            <nav aria-label={`${APP_NAME} policies`} className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="text-indigo-500 hover:underline dark:text-indigo-400">
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </section>

        <section aria-labelledby="cm-download" className="relative overflow-hidden bg-[#150d2e] py-20 text-white">
          <div aria-hidden="true" className="absolute -right-24 -top-16 h-80 w-80 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="container relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 text-center">
            <img
              src="/collagemagik/icon.png"
              alt=""
              width={72}
              height={72}
              className="mb-5 h-[72px] w-[72px] rounded-[1.1rem] shadow-2xl shadow-black/40"
            />
            <h2 id="cm-download" className="text-3xl font-bold font-heading">Get {APP_NAME} on your iPhone</h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-violet-50/80">
              Mix photos and videos in one collage, or build a carousel that keeps people swiping.
            </p>
            <div className="mt-8">
              <AppStoreButton href={iosUrl} />
            </div>
            <p className="mt-4 text-sm text-violet-100/60">{FACTS}</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
