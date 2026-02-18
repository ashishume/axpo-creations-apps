# School Financial Management System

A comprehensive school financial management system for tracking income and expenses across multiple schools. Built with **React 18**, **TypeScript**, **Tailwind CSS**, and **Recharts**. All state is local with **localStorage** persistence (no backend).

## Features

- **Schools & Sessions** – Add/edit/delete schools and academic session years; switch between them in the UI.
- **Student income** – Track students with target amount, fee type (Regular / Boarding / Day Scholar + Meals / Boarding + Meals), payment history, running balance, and status (Fully Paid / Partially Paid / Not Paid). Regular schools support fixed due dates and optional fine per day.
- **Staff & salary** – Manage teachers, admin, bus drivers, support staff with monthly salary and payment status by month.
- **Expenses** – Log expenses by category (Transportation, Events, Utilities, Supplies, Infrastructure, Miscellaneous) with date, amount, vendor, and payment method.
- **Dashboard** – Income vs expenses, expense breakdown, student payment status, salary vs other expenses, monthly cash flow.
- **Year-end report** – Summary for the selected session with print / Save as PDF.

## Tech stack

- React 18 + TypeScript
- Tailwind CSS v4 (@tailwindcss/vite)
- Recharts, Lucide React, date-fns
- localStorage for persistence

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Use **Load sample data** in the sidebar to prefill schools, sessions, students, staff, and expenses for testing.

## Build

```bash
npm run build
npm run preview   # preview production build
```

## Data

- All data is stored in the browser’s localStorage under keys `sfms_schools`, `sfms_sessions`, `sfms_students`, `sfms_staff`, `sfms_expenses`.
- Use **Clear all data** in the sidebar to reset (with confirmation).
