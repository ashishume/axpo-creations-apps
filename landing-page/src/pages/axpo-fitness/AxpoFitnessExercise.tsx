import { useEffect } from "react";
import { Activity, ArrowRight, ArrowUpRight, CircleHelp, Play } from "lucide-react";
import "./AxpoFitnessLanding.css";
import "./AxpoFitnessExercise.css";
import { APPS } from "@/lib/constants";

// Shared exercise videos from the apps: https://www.axpocreation.com/axpo-fitness/exercise/<YouTube id>?name=Push-up.
// With the app installed these links open it directly (/.well-known/apple-app-site-association and assetlinks.json);
// everyone else lands here, watches the demo and can get the app.
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

  // Android: open the app if it's installed, otherwise Google Play.
  const androidOpen = videoId
    ? `intent://www.axpocreation.com/axpo-fitness/exercise/${videoId}?name=${encodeURIComponent(name)}` +
      `#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(APPS.fitness.androidUrl)};end`
    : APPS.fitness.androidUrl;

  return (
    <main className="fitness-page fitness-exercise">
      <div className="fitness-container fitness-exercise-inner">
        <a className="fitness-brand" href="/axpo-fitness" aria-label="Axpo Fitness home">
          <span className="fitness-brand-mark"><Activity size={21} strokeWidth={2.4} aria-hidden="true" /></span>
          <span>axpo<span className="fitness-brand-light">fitness</span></span>
        </a>

        {videoId ? (
          <div className="fitness-exercise-body">
            <div className="fitness-exercise-video">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${videoId}?playsinline=1&rel=0&modestbranding=1`}
                title={`${name} demo`}
                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="fitness-exercise-copy">
              <span className="fitness-exercise-kicker"><Play size={13} /> EXERCISE DEMO</span>
              <h1>{name}</h1>
              <p>Watch how it&apos;s done, then open Axpo Fitness to train it in a plan made around you.</p>
              <div className="fitness-exercise-actions">
                {device === "android" && (
                  <a className="fitness-button-light" href={androidOpen}>Open in Axpo Fitness <ArrowRight size={16} /></a>
                )}
                {device !== "ios" && (
                  <a className="fitness-button-outline" href={APPS.fitness.androidUrl} target="_blank" rel="noopener noreferrer">
                    Get it on Google Play <ArrowUpRight size={17} />
                  </a>
                )}
                {device !== "android" && (
                  <a className={device === "ios" ? "fitness-button-light" : "fitness-button-outline"} href={APPS.fitness.iosUrl}
                     target="_blank" rel="noopener noreferrer">
                    Download on the App Store <ArrowUpRight size={17} />
                  </a>
                )}
              </div>
              <span className="fitness-exercise-note"><CircleHelp size={14} /> Have the app? Opening this link on your phone takes you straight to the exercise.</span>
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
