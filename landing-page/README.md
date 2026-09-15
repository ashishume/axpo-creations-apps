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
