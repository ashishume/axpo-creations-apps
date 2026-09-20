# Landing Page

AxpoCreation landing website — React + Vite + TypeScript + Tailwind v4.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Family invite links use `/open/family/invite/:token`. The landing route opens
`axpo-expense://family/invite/:token` in the installed app and otherwise shows
the invite code with a link to download AXPO.

## Build

```bash
npm run build
```

Output is in `dist/`. Preview with:

```bash
npm run preview
```

## Deploy on Vercel

1. Push this repo (or the `landing-page` folder as the root of a new repo).
2. In [Vercel](https://vercel.com), import the project and set **Root Directory** to `landing-page` if the repo root is the parent.
3. Vercel will use `vercel.json` (build command, output directory, SPA rewrites). No extra config needed.
4. Deploy.

If you deploy only the `landing-page` folder as its own repo, use the repo root and leave Root Directory empty.


## Mindstrike App Store pages

Mindstrike has its own static pages, separate from Axpo Tracker's policies:

- Marketing: https://www.axpocreation.com/mindstrike
- Privacy: https://www.axpocreation.com/mindstrike/privacy
- Terms: https://www.axpocreation.com/mindstrike/terms
- Support: https://www.axpocreation.com/mindstrike/support
- Deletion / privacy choices: https://www.axpocreation.com/mindstrike/delete-account

Edit `public/mindstrike/*.html` and the shared `site.css`. These pages use local
assets and system fonts; they do not load the main SPA's AdSense script, analytics,
external fonts or optional cookies. They are readable without JavaScript.
`vercel.json` maps the clean URLs to HTML before the SPA fallback; the Vite plugin
mirrors those routes during development and preview. The footer uses a normal
anchor so navigation leaves the SPA. Do not replace it with a client-side Link.

Before publishing, run `npm run build`, check all five routes with `npm run preview`,
and keep their content aligned with the shipped app. Account deletion is provided
through authenticated Supabase request/status RPCs in the iOS app. Requests store
account details and a seven-day completion deadline for manual processing; they do
not erase accounts immediately. This is separate from the expense app's web API. The MathsArena repository contains deployment instructions and
the App Store submission checklist. Do not claim the app is ready for review until
native sign-in, actual manual deletion, Apple token revocation and completion
confirmation have been exercised in production.
