/**
 * App names and URLs used across the landing page.
 */
export const APPS = {
  biller: {
    name: "Axpo Biller",
    url: "https://billing.axpocreation.com/",
  },
  eduFinance: {
    name: "Axpo EduFinance",
    url: "https://school.axpocreation.com/",
  },
} as const;

/** Contact phone (India). Used for WhatsApp and display. */
export const CONTACT_PHONE = "8557098095";
export const CONTACT_WHATSAPP_URL = `https://wa.me/91${CONTACT_PHONE}`;

/** Backend API base URL for account deletion requests (Axpo Expense). Set VITE_API_URL in .env. */
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "") || "";
