# Bricks Factory Billing (MVP)

GST-compliant billing software for brick manufacturing factories in India. Vite + React + Supabase.

## Features

- **Setup** – Company profile (name, address, GSTIN, PAN, bank, logo URL, financial year)
- **Products** – CRUD, 4 types (Red Clay, Fly Ash, Wire Cut, Concrete Blocks), HSN 6904, GST rates, stock
- **Customers** – CRUD, types (Dealer/Contractor/Retail/Builder), phone, GSTIN, address, credit days/limit
- **Invoices** – Create with multiple lines, CGST+SGST/IGST, round off, total in words; print; cancel with reason
- **Payments** – Cash/Cheque/Online, allocate to invoices, receipt print
- **Stock** – View (opening, in, out, current), production entry, adjustment, opening stock entry; low stock alert (500)
- **Reports** – Sales (date range, export CSV), Customer outstanding, Stock, Payment, Customer ledger (with date filter, print)

## Run

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, then open [http://localhost:5173](http://localhost:5173).

## Deploy on Vercel

1. **Push code to GitHub** (if not already), then at [vercel.com](https://vercel.com) → **Add New… → Project** and import the repo.

2. **If the repo root is the monorepo** (e.g. `startup`), set **Root Directory** to `billing-tech` in the Vercel project settings so `vercel.json` and `npm run build` run from that folder.

3. **Environment variables** (Project → Settings → Environment Variables): add  
   - `VITE_SUPABASE_URL` – Supabase project URL  
   - `VITE_SUPABASE_ANON_KEY` – Supabase anon key  
   Redeploy after adding them.

4. **Build** uses `npm run build`; output is `dist/`. The `vercel.json` rewrites all non-asset routes to `index.html`, so **refreshing on any route** (e.g. `/products`, `/invoices/123`) works correctly.

## Tech

- Vite, React, React Router, TypeScript
- Supabase for data
- Tailwind CSS; forms, tables, print styles
