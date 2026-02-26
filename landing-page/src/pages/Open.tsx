import { useEffect, useRef, useState } from "react";

const SCHEME = "axpo-expense";
const WEB_BASE = "https://www.axpocreation.com";
const OG_IMAGE = "https://www.axpocreation.com/logo.jpg";

type OpenType = "splitter" | "lend";

const CONTENT: Record<
  OpenType,
  { icon: string; title: string; subtitle: string; detail: string }
> = {
  splitter: {
    icon: "👥",
    title: "Split Group",
    subtitle: "Someone shared an expense group with you",
    detail: "Tap below to view the group in Axpo Tracker",
  },
  lend: {
    icon: "💰",
    title: "Loan Details",
    subtitle: "Someone shared loan details with you",
    detail: "Tap below to view the loan in Axpo Tracker",
  },
};

function setMetaTag(
  property: string,
  content: string,
  isOg = true
): () => void {
  const attr = isOg ? "property" : "name";
  const selector = `meta[${attr}="${property}"]`;
  let el = document.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  const prev = el.getAttribute("content");
  el.setAttribute("content", content);
  return () => {
    if (prev !== null) el?.setAttribute("content", prev);
    else el?.remove();
  };
}

export default function Open() {
  const [showFallback, setShowFallback] = useState(false);
  const appOpenedRef = useRef(false);

  // Parse path: support any base path (e.g. / or /app) so /open/splitter/id or /base/open/splitter/id works
  const path = typeof window !== "undefined" ? window.location.pathname : "";
  const pathAfterOpen = path.includes("/open/")
    ? path.slice(path.indexOf("/open/") + "/open/".length)
    : path.replace(/^\/open\/?/, "");
  const segments = pathAfterOpen.split("/").filter(Boolean);
  const type = segments[0] as OpenType | undefined;
  const id = segments[1];

  const validType = type === "splitter" || type === "lend";
  const deepLink =
    validType && id ? `${SCHEME}://${type}/${id}` : `${SCHEME}://`;

  // OG/social meta for deep link previews (WhatsApp, etc.) – same as axpo-expense/public/open.html
  useEffect(() => {
    if (!validType || !type) return;
    const title = "Open in Axpo Tracker";
    const description = "Tap to open in the Axpo Tracker app";
    const prevTitle = document.title;
    document.title = title;
    const restores: Array<() => void> = [
      () => { document.title = prevTitle; },
      setMetaTag("og:title", "Axpo Tracker"),
      setMetaTag("og:description", description),
      setMetaTag("og:image", OG_IMAGE),
      setMetaTag("og:type", "website"),
      setMetaTag("twitter:card", "summary", false),
      setMetaTag("twitter:title", "Axpo Tracker", false),
      setMetaTag("twitter:description", description, false),
      setMetaTag("twitter:image", OG_IMAGE, false),
    ];
    return () => restores.forEach((r) => r());
  }, [validType, type]);

  useEffect(() => {
    if (!validType || !id) {
      window.location.href = WEB_BASE + "/";
      return;
    }

    const onVisibilityChange = () => {
      if (document.hidden) appOpenedRef.current = true;
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = deepLink;
    document.body.appendChild(iframe);

    const t1 = setTimeout(() => {
      window.location.href = deepLink;
    }, 100);

    const t2 = setTimeout(() => {
      if (!appOpenedRef.current) setShowFallback(true);
    }, 2500);

    const t3 = setTimeout(() => {
      if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
    }, 5000);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [validType, id, deepLink]);

  if (!validType || !id) {
    return null;
  }

  const content = CONTENT[type as OpenType];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#f8fafc",
      }}
    >
      <div
        className="w-full max-w-[400px] rounded-3xl p-8 sm:p-10 text-center border border-white/10"
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          className="w-20 h-20 mx-auto mb-6 rounded-xl flex items-center justify-center text-4xl"
          style={{
            background: "linear-gradient(135deg, #14b8a6, #0d9488)",
            boxShadow: "0 8px 32px rgba(20, 184, 166, 0.3)",
          }}
        >
          {content.icon}
        </div>
        <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
        <p className="text-[15px] text-slate-400 mb-1 leading-snug">
          {showFallback ? "App not detected" : content.subtitle}
        </p>
        <p className="text-[13px] text-slate-500 mb-8">
          {showFallback ? "Install Axpo Tracker or open the web version" : content.detail}
        </p>

        {!showFallback ? (
          <div>
            <div
              className="w-6 h-6 mx-auto mb-4 rounded-full border-3 border-white/15 border-t-white animate-spin"
              style={{ animation: "spin 0.7s linear infinite" }}
            />
            <p className="text-sm text-slate-400 mb-6">
              Redirecting to Axpo Tracker...
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <a
              href={deepLink}
              className="flex items-center justify-center w-full py-4 px-6 rounded-xl text-[17px] font-semibold text-white no-underline active:scale-[0.97] transition-transform"
              style={{
                background: "linear-gradient(135deg, #14b8a6, #0d9488)",
                boxShadow: "0 4px 20px rgba(20, 184, 166, 0.4)",
              }}
            >
              Open in App
            </a>
            <a
              href={WEB_BASE + "/"}
              className="flex items-center justify-center w-full py-4 px-6 rounded-xl text-[17px] font-semibold no-underline border border-white/10 active:scale-[0.97] transition-transform"
              style={{
                background: "rgba(255, 255, 255, 0.08)",
                color: "#cbd5e1",
              }}
            >
              Open Web Version
            </a>
          </div>
        )}

        <p className="mt-8 text-xs text-slate-500">
          Powered by{" "}
          <a
            href={WEB_BASE + "/"}
            className="text-teal-400 no-underline hover:underline"
          >
            Axpo Tracker
          </a>
        </p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
