/**
 * App names and URLs used across the landing page.
 */
export const APPS = {
  tracker: {
    name: "AXPO",
    iosUrl: "https://apps.apple.com/in/app/axpo-expense-manager/id6759822547",
    androidUrl: "https://play.google.com/store/apps/details?id=com.axpo.expense",
  },
  mindstrike: {
    name: "Mindstrike",
    iosUrl: "https://apps.apple.com/us/app/mindstrike-arena-for-minds/id6813953183",
    /** Static marketing page served from public/mindstrike (not an SPA route). */
    siteUrl: "/mindstrike",
  },
} as const;

/** Public contact email. */
export const CONTACT_EMAIL = "aaxpocreation@gmail.com";

/** Backend API base URL for AXPO account deletion requests. Set VITE_API_URL in .env. */
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") || "";
