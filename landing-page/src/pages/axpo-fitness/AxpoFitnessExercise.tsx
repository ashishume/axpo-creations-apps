import { useEffect } from "react";
import { Activity, ArrowRight, ArrowUpRight, CircleHelp, Play } from "lucide-react";
import "./AxpoFitnessLanding.css";
import "./AxpoFitnessExercise.css";
import { APPS } from "@/lib/constants";

// Shared exercise videos from the apps: https://www.axpocreation.com/axpo-fitness/exercise/<YouTube id>?name=Push-up.
// With the app installed these links open it directly (/.well-known/apple-app-site-association and assetlinks.json).
// Everyone else lands here: the video plays only in the app, so this page shows its still and sends people to the app.
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const ANDROID_PACKAGE = "com.axpo.fitness";

function platform(): "ios" | "android" | "other" {
  const agent = navigator.userAgent;
  if (/android/i.test(agent)) return "android";
  if (/iphone|ipad|ipod/i.test(agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)) return "ios";
  return "other";
}

export default function AxpoFitnessExercise({ params }: { params: { videoId: string } }) {
  const videoId = VIDEO_ID.test(params.videoId) ? params.videoId : null;
  const name = (new URLSearchParams(window.location.search).get("name") || "").trim().slice(0, 80) || "Exercise";
  const device = platform();

  useEffect(() => {
    const previous = document.title;
    document.title = `${name} — how to do it | Axpo Fitness`;
    return () => { document.title = previous; };
  }, [name]);

  const query = `?name=${encodeURIComponent(name)}`;
  // Android: the app if it's installed, otherwise Google Play.
  const androidOpen = `intent://www.axpocreation.com/axpo-fitness/exercise/${videoId}${query}` +
    `#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(APPS.fitness.androidUrl)};end`;

  // iPhone: a link to this same site doesn't open the app, so use its own address; if nothing opened, the App Store.
  function openOnIPhone() {
    const fallback = window.setTimeout(() => { window.location.href = APPS.fitness.iosUrl; }, 1500);
    const cancel = () => { if (document.hidden) window.clearTimeout(fallback); };
    document.addEventListener("visibilitychange", cancel, { once: true });
    window.location.href = `axpofitness://exercise/${videoId}${query}`;
  }

  const openInApp = device === "ios"
    ? { href: "#", onClick: (event: React.MouseEvent) => { event.preventDefault(); openOnIPhone(); } }
    : device === "android" ? { href: androidOpen } : null;

  return (
    <main className="fitness-page fitness-exercise">
      <div className="fitness-container fitness-exercise-inner">
        <a className="fitness-brand" href="/axpo-fitness" aria-label="Axpo Fitness home">
          <span className="fitness-brand-mark"><Activity size={21} strokeWidth={2.4} aria-hidden="true" /></span>
          <span>axpo<span className="fitness-brand-light">fitness</span></span>
        </a>

        {videoId ? (
          <div className="fitness-exercise-body">
            {openInApp ? (
              <a className="fitness-exercise-video" {...openInApp} aria-label={`Watch ${name} in the Axpo Fitness app`}>
                <Still videoId={videoId} name={name} />
              </a>
            ) : (
              <div className="fitness-exercise-video"><Still videoId={videoId} name={name} /></div>
            )}
            <div className="fitness-exercise-copy">
              <span className="fitness-exercise-kicker"><Play size={13} /> EXERCISE DEMO</span>
              <h1>{name}</h1>
              <p>The video plays in the Axpo Fitness app, with step-by-step instructions and a plan made around you.</p>
              <div className="fitness-exercise-actions">
                {openInApp && (
                  <a className="fitness-button-light" {...openInApp}>Watch in Axpo Fitness <ArrowRight size={16} /></a>
                )}
                {device !== "ios" && (
                  <a className="fitness-button-outline" href={APPS.fitness.androidUrl} target="_blank" rel="noopener noreferrer">
                    Get it on Google Play <ArrowUpRight size={17} />
                  </a>
                )}
                {device !== "android" && (
                  <a className="fitness-button-outline" href={APPS.fitness.iosUrl} target="_blank" rel="noopener noreferrer">
                    Download on the App Store <ArrowUpRight size={17} />
                  </a>
                )}
              </div>
              <span className="fitness-exercise-note"><CircleHelp size={14} /> No app yet? Install it, then open this link again on your phone.</span>
            </div>
          </div>
        ) : (
          <div className="fitness-exercise-copy fitness-exercise-missing">
            <h1>This link doesn&apos;t work</h1>
            <p>The exercise link looks incomplete. Ask for it to be shared again, or explore Axpo Fitness.</p>
            <div className="fitness-exercise-actions">
              <a className="fitness-button-light" href="/axpo-fitness">Explore Axpo Fitness <ArrowRight size={16} /></a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/** The video's still with a play button: a preview only, it never plays here. */
function Still({ videoId, name }: { videoId: string; name: string }) {
  return (
    <>
      <img src={`https://i.ytimg.com/vi/${videoId}/oar2.jpg`} alt={`${name} demo`} loading="eager" />
      <span className="fitness-exercise-play" aria-hidden="true"><Play size={30} fill="currentColor" /></span>
      <span className="fitness-exercise-play-label" aria-hidden="true">Watch in the app</span>
    </>
  );
}
