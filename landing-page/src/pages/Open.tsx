import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { detectMobilePlatform } from "@/lib/mobilePlatform";

const SCHEME = "axpo-expense";
const WEB_BASE = "https://www.axpocreation.com";
const OG_IMAGE = "https://www.axpocreation.com/axpo-logo.png";

/** Preserve the app route and case-sensitive invitation token. */
function pathAfterOpen(pathname: string): string {
  const marker = "/open/";
  const idx = pathname.indexOf(marker);
  if (idx !== -1) {
    return pathname.slice(idx + marker.length).replace(/^\/+/, "");
  }
  if (pathname === "/open" || pathname.endsWith("/open")) {
    return "";
  }
  return pathname.replace(/^\/open\/?/, "").replace(/^\/+/, "");
}

type PageContent = {
  icon: string;
  title: string;
  subtitle: string;
  detail: string;
  fallbackHref: string;
  fallbackLabel: string;
  fallbackDetail: string;
  inviteCode?: string;
  inviteLink?: string;
  isGroupInvite?: boolean;
};

function contentForPath(path: string): PageContent | null {
  const segments = path.split("/").filter(Boolean);
  const type = segments[0];
  const second = segments[1];

  if (type === "splitter") {
    const isGroupInvite = second === "invite";
    const isFriendInvite = second === "friend-invite";
    if ((isGroupInvite || isFriendInvite) && !segments[2]) return null;
    return {
      icon: "👥",
      title: isGroupInvite ? "Group invitation" : isFriendInvite ? "Friend invitation" : "Split Group",
      subtitle: isGroupInvite
        ? "You’re invited to share expenses on AXPO"
        : isFriendInvite ? "Someone invited you to connect on AXPO" : "Someone shared an expense group with you",
      detail: isGroupInvite ? "Open AXPO to join the group" : "Tap below to open in AXPO",
      fallbackHref: `${WEB_BASE}/axpo`,
      fallbackLabel: "Download AXPO",
      fallbackDetail: "Install AXPO and sign in, then return to this page and tap Open in App.",
      inviteLink: isGroupInvite || isFriendInvite ? `${WEB_BASE}/open/${path}` : undefined,
      isGroupInvite,
    };
  }

  if (type === "family" && second === "invite" && segments[2]) {
    const rawToken = segments[2].trim();
    const inviteCode = /^[a-z0-9]{8}$/i.test(rawToken)
      ? rawToken.toUpperCase()
      : rawToken;

    return {
      icon: "🏠",
      title: "Family Invite",
      subtitle: "Someone invited you to a shared family expense ledger",
      detail: "Tap below to join the family in AXPO",
      fallbackHref: `${WEB_BASE}/axpo`,
      fallbackLabel: "Download AXPO",
      fallbackDetail:
        "Install AXPO, then reopen this link or enter the invite code",
      inviteCode,
    };
  }

  if (type === "lend") {
    let title = "Loan Details";
    let subtitle = "Someone shared loan details with you";
    if (second === "institutional") {
      title = "Institutional Loan";
      subtitle = "Someone shared a bank / EMI loan with you";
    } else if (second === "contact") {
      title = "Lending Contact";
      subtitle = "Someone shared a lending contact with you";
    } else if (second === "p2p") {
      title = "Personal Loan";
      subtitle = "Someone shared a loan with you";
    }
    return {
      icon: "💰",
      title,
      subtitle,
      detail: "Tap below to open in AXPO",
      fallbackHref: `${WEB_BASE}/`,
      fallbackLabel: "Open Web Version",
      fallbackDetail: "Install AXPO or open the web version",
    };
  }

  return null;
}

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
  const [copyStatus, setCopyStatus] = useState("");
  const invitationRef = useRef<HTMLTextAreaElement>(null);
  const [platform] = useState(() =>
    typeof navigator === "undefined" ? "other" : detectMobilePlatform(navigator)
  );

  const path = typeof window !== "undefined" ? pathAfterOpen(window.location.pathname) : "";
  const deepLink = `${SCHEME}://${path}`;
  const content = useMemo(() => contentForPath(path), [path]);
  const validType = content !== null;

  useEffect(() => {
    if (!validType) {
      window.location.href = `${WEB_BASE}/`;
    }
  }, [validType]);

  useEffect(() => {
    if (!validType) return;
    const title = content?.title ?? "Open in AXPO";
    const description = content?.subtitle ?? "Tap to open in AXPO";
    const prevTitle = document.title;
    document.title = title;
    const restores: Array<() => void> = [
      () => {
        document.title = prevTitle;
      },
      setMetaTag("og:title", title),
      setMetaTag("og:description", description),
      setMetaTag("og:image", OG_IMAGE),
      setMetaTag("og:type", "website"),
      setMetaTag("twitter:card", "summary", false),
      setMetaTag("twitter:title", title, false),
      setMetaTag("twitter:description", description, false),
      setMetaTag("twitter:image", OG_IMAGE, false),
    ];
    return () => restores.forEach((r) => r());
  }, [content, validType]);

  useEffect(() => {
    if (!validType) return;
    setCopyStatus("");
    if (platform === "other") {
      setShowFallback(true);
      return;
    }
    setShowFallback(false);

    const onVisibilityChange = () => {
      if (!document.hidden) setShowFallback(true);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const t1 = setTimeout(() => {
      if (!document.hidden) window.location.href = deepLink;
    }, 100);

    const t2 = setTimeout(() => {
      setShowFallback(true);
    }, 2500);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [validType, deepLink, platform]);

  async function copyInvitation() {
    if (!content?.inviteLink) return;
    try {
      await navigator.clipboard.writeText(content.inviteLink);
      setCopyStatus("Invitation link copied.");
    } catch {
      invitationRef.current?.focus();
      invitationRef.current?.select();
      setCopyStatus("Copy wasn’t available. Select and copy the invitation link above.");
    }
  }

  if (!validType || !content) {
    return null;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-5 text-foreground">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card px-6 py-8 text-center text-card-foreground shadow-xl sm:px-8">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 text-[40px]" aria-hidden="true">
          {content.icon}
        </div>
        <h1 className="mb-2 text-2xl font-bold">{content.title}</h1>
        <p className="mb-3 text-base text-muted-foreground">{content.subtitle}</p>
        <p className="mb-6 text-sm text-muted-foreground">
          {showFallback ? content.fallbackDetail : content.detail}
        </p>

        {content.inviteCode ? (
          <div className="mb-6 rounded-xl border border-border bg-muted px-4 py-3">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Invite code
            </p>
            <p className="break-all font-mono text-xl font-bold tracking-widest">
              {content.inviteCode}
            </p>
          </div>
        ) : null}

        {content.inviteLink ? (
          <div className="mb-6 rounded-xl border border-border bg-muted p-4 text-left">
            <label htmlFor="invitation-link" className="mb-2 block text-sm font-semibold">
              Invitation link
            </label>
            <Textarea
              id="invitation-link"
              ref={invitationRef}
              readOnly
              rows={3}
              value={content.inviteLink}
              onFocus={(event) => event.currentTarget.select()}
              className="resize-none break-all bg-background text-foreground"
              aria-describedby="invitation-help"
            />
            <Button type="button" variant="secondary" className="mt-3 w-full" onClick={copyInvitation}>
              Copy invitation link
            </Button>
            <p role="status" className="mt-2 text-sm text-muted-foreground">{copyStatus}</p>
            <p id="invitation-help" className="mt-3 text-sm text-muted-foreground">
              Keep this link so you can reopen the invitation after installing AXPO or signing in.
              {content.isGroupInvite && platform === "ios"
                ? " In the iOS app, you can also paste it in Splitter → Join group."
                : ""}
            </p>
          </div>
        ) : null}

        {!showFallback && (
          <p role="status" className="mb-4 text-sm text-muted-foreground">
            Opening AXPO… If nothing happens, tap Open in App below.
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Button asChild size="lg" className="min-h-12 rounded-xl text-base">
            <a href={deepLink}>Open in App</a>
          </Button>
          <Button asChild variant="secondary" size="lg" className="min-h-12 rounded-xl text-base">
            <a href={content.fallbackHref}>{content.fallbackLabel}</a>
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Powered by{" "}
          <a href={`${WEB_BASE}/`} className="text-primary hover:underline">AXPO</a>
        </p>
      </section>
    </main>
  );
}
