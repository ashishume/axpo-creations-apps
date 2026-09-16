# Figureout launch pages

Edit `figureout.mjs`; `npm run build` and `npm run dev` regenerate `public/figureout/`. Generated files are ignored by git and copied into `dist` by Vite. The production host is `https://axpocreation.com` (currently redirects to `www`); Vercel rewrites and the local Vite middleware serve the same clean URLs.

Run `npm run test:figureout` plus `npm run build`. Check every page by its heading, not just HTTP 200, because the old SPA fallback returns 200 for unknown paths. Test all internal navigation and the contact mailto on a phone-width viewport. There is no fake contact form, authentication, cookie banner or analytics script on these pages.

Before publishing, get owner/legal approval of the operator/contact, eligibility, retention language and actual moderation practice. These are engineering drafts aligned with the accompanying Figureout code, not a legal opinion or App Store approval. The app/backend safety code and database migration must also ship; do not publish claims of controls that are not available in the released app.

Full launch checklist and moderation runbook are in the separate `figureout-ios/docs/APP-STORE-LAUNCH.md` and `PLAYER-SAFETY.md`. Existing expense and wellness app pages were intentionally not changed.
