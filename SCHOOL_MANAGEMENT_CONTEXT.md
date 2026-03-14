# Axpo School Management Software - Feature Context Document

Use this document to provide context to LLMs when working on this codebase.

---

## Overview

A multi-tenant school management SaaS application built with:
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** FastAPI + SQLAlchemy + Alembic (Python)
- **Database:** PostgreSQL via Supabase (or self-hosted)
- **AI:** OpenRouter integration for natural language assistant

---

## Core Modules & Features

### 1. Dashboard (`/`)
- Financial overview: income (fees, stock sales) vs expenses
- Payment collection status charts
- Monthly trends and analytics
- Quick stats cards

### 2. Organizations (`/organizations`) - Super Admin Only
- Multi-tenant management
- Organization CRUD operations
- Tenant isolation

### 3. Schools & Sessions (`/schools`)
- School management (name, address, contact)
- Academic sessions/years management
- Session dates, salary due day configuration
- School locking capability (Super Admin)
- Plan assignment (Starter, Premium)

### 4. Students & Fees (`/students`)
- Student registration and management
- Class assignment with fee structures
- One-time and monthly fee tracking
- Payment collection and receipts
- Sibling linking for fee sharing
- Bulk student import (CSV/Excel)
- Late fee calculation
- Payment history and status

### 5. Staff & Salary (`/staff`)
- Staff registration (teachers, admin, support)
- Role assignment
- Salary configuration
- Salary payment tracking
- Multiple salary payments per month support

### 6. Expenses (`/expenses`)
- Expense categories management
- Expense recording (vendor, amount, method)
- Expense reporting and filtering

### 7. Stock & Publishers (`/stocks`)
- Book/material stock management
- Publisher credit tracking
- Stock transactions (purchase, sale, return)
- Publisher payment tracking
- Stock status (pending, partial, cleared)

### 8. Leave Management (`/leaves`)
- Leave types configuration (casual, sick, etc.)
- Applicable to: staff, student, or both
- Leave balance initialization
- Leave request workflow (apply → review → approve/reject)
- Balance tracking and deduction
- Document attachment support

### 9. Year-End Report (`/report`)
- Comprehensive financial report
- Income vs expense summary
- Outstanding fees report
- Exportable reports

### 10. User Management (`/users`)
- User CRUD operations
- Role assignment
- Organization and school scoping
- Staff/Student account linking

### 11. Roles & Permissions (`/roles`)
- Role management
- Granular permission assignment
- System roles (non-deletable)

### 12. Subscription Plans (`/subscription`)
- Plan management (Starter free, Axpo Assistant paid)
- Feature gating by plan

### 13. Axpo Assistant (`/assistant`)
- AI-powered natural language interface
- CRUD operations via chat
- Analytics queries
- Chat history persistence

---

## Data Entities

### Core Entities
| Entity | Key Fields |
|--------|------------|
| **Organization** | id, name, slug |
| **School** | id, organizationId, name, address, planId, isLocked |
| **Session** | id, schoolId, year, startDate, endDate, salaryDueDay |
| **StudentClass** | id, sessionId, name, oneTimeFee, monthlyFee, lateFee, feeDueDay |
| **Student** | id, classId, name, rollNumber, phone, address, siblingId, fees, payments |
| **Staff** | id, schoolId, name, role, phone, salary, salaryPayments |
| **Expense** | id, sessionId, category, vendor, amount, date, paymentMethod |
| **Stock** | id, sessionId, publisherName, totalAmount, paidAmount, status, transactions |
| **FixedMonthlyCost** | id, sessionId, name, amount |

### Leave Entities
| Entity | Key Fields |
|--------|------------|
| **LeaveType** | id, sessionId, name, code, applicableTo, maxDaysPerYear, requiresDocument |
| **LeaveBalance** | id, staffId, leaveTypeId, year, totalDays, usedDays |
| **LeaveRequest** | id, sessionId, leaveTypeId, applicantType, staffId/studentId, fromDate, toDate, daysCount, reason, status, reviewedBy |

### Auth Entities
| Entity | Key Fields |
|--------|------------|
| **User** | id, email, organizationId, roleId, staffId, studentId |
| **Role** | id, name, permissions[], isSystem |
| **Permission** | string (e.g., "students:view", "leaves:approve") |

---

## User Roles & Permissions

### Default Roles
| Role | Scope | Key Permissions |
|------|-------|-----------------|
| **Super Admin** | Platform-wide | All permissions, org management, app lock, plans |
| **Admin** | Organization | Most permissions except schools:create, app:lock, plans:manage |
| **Manager** | School | Operations except roles:manage, users:delete |
| **Teacher** | School | Dashboard, students, staff, reports (view-heavy) |
| **Student** | Self | Dashboard only (own data) |

### Permission Modules
- `dashboard:view`
- `students:view`, `students:create`, `students:update`, `students:delete`
- `staff:view`, `staff:create`, `staff:update`, `staff:delete`
- `expenses:view`, `expenses:create`, `expenses:update`, `expenses:delete`
- `stocks:view`, `stocks:create`, `stocks:update`, `stocks:delete`
- `leaves:view`, `leaves:create`, `leaves:approve`
- `reports:view`, `reports:export`
- `settings:view`, `settings:update`
- `users:view`, `users:create`, `users:update`, `users:delete`
- `roles:view`, `roles:manage`
- `schools:view`, `schools:create`, `schools:update`
- `app:lock`
- `plans:manage`
- `assistant:use`

---

## Project Structure

```
axpo-creations-apps/
├── school/                      # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/              # Route pages
│   │   ├── components/         # UI components
│   │   │   ├── ui/            # Reusable UI (Button, Card, Modal, etc.)
│   │   │   ├── auth/          # Auth components
│   │   │   ├── assistant/     # AI assistant components
│   │   │   ├── students/      # Student-specific components
│   │   │   ├── leaves/        # Leave management components
│   │   │   └── layout/        # Layout, Sidebar
│   │   ├── hooks/             # React Query hooks
│   │   ├── context/           # AppContext, AuthContext
│   │   ├── lib/
│   │   │   └── db/
│   │   │       ├── repositories/  # Supabase data layer
│   │   │       ├── api/           # Backend API layer
│   │   │       └── migrations/    # SQL migrations
│   │   └── types/             # TypeScript interfaces
│   └── public/
│
├── backend/                    # Backend (FastAPI)
│   └── app/
│       ├── teaching/          # School management API
│       │   ├── api/v1/       # Route handlers
│       │   ├── models/       # SQLAlchemy models
│       │   ├── repositories/ # Data access layer
│       │   └── schemas/      # Pydantic schemas
│       ├── billing/          # Billing/invoicing API
│       └── core/             # Shared utilities
│
└── SCHOOL_MANAGEMENT_CONTEXT.md  # This file
```

---

## Key Technical Details

### Data Layer Options
The frontend supports two data backends:
1. **Supabase (default):** Direct Supabase client calls via `src/lib/db/repositories/`
2. **Backend API:** When `VITE_TEACHING_API_URL` is set, uses `src/lib/db/api/` instead

### State Management
- **React Query:** Server state, caching, mutations
- **AppContext:** Global app state (sessions, schools, staff, students, toast)
- **AuthContext:** User session, permissions, sign in/out

### Authentication Flow
1. User signs in via Supabase Auth or backend JWT
2. User record loaded with role and permissions
3. `ProtectedRoute` checks auth and permissions
4. `PermissionGate` conditionally renders UI elements
5. Data queries scoped by organization/school

### Database Tables (Supabase)
Tables prefixed with ``:
- `organizations`
- `schools`
- `sessions`
- `classes`
- `students`
- `student_payments`
- `staff`
- `salary_payments`
- `expenses`
- `stocks`
- `stock_transactions`
- `fixed_monthly_costs`
- `leave_types`
- `leave_balances`
- `leave_requests`
- `roles`
- `users`
- `assistant_chat_messages`

---

## Environment Variables

### Frontend (`school/.env.local`)
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_TEACHING_API_URL=         # Optional: Use backend API instead of Supabase
VITE_MAINTENANCE_MODE=false
```

### Backend (`backend/.env`)
```
DATABASE_URL=
TEACHING_DATABASE_URL=
SECRET_KEY=
OPENROUTER_API_KEY=           # For AI assistant
```

---

## Common Operations

### Adding a New Feature
1. Create types in `src/types/index.ts`
2. Add repository in `src/lib/db/repositories/`
3. Add API layer in `src/lib/db/api/` (if using backend)
4. Create hooks in `src/hooks/`
5. Build components in `src/components/`
6. Create page in `src/pages/`
7. Add route in `src/components/layout/Layout.tsx`
8. Add permissions to roles
9. Add backend endpoint if using backend API

### Adding Permissions
1. Add permission string to `Permission` type
2. Add to relevant role's permissions array
3. Use `hasPermission()` or `<PermissionGate>` in UI
4. Guard backend endpoints

---

## Current Feature Status

| Feature | Status |
|---------|--------|
| Multi-tenant organizations | ✅ Complete |
| Schools & sessions | ✅ Complete |
| Student management | ✅ Complete |
| Fee collection | ✅ Complete |
| Staff & salary | ✅ Complete |
| Expenses | ✅ Complete |
| Stock/publisher management | ✅ Complete |
| Leave management | ✅ Complete |
| User & role management | ✅ Complete |
| AI Assistant | ✅ Complete |
| Student portal | 🚧 Built, not routed |
| Notifications | ❌ Not implemented |
| SMS/Email alerts | ❌ Not implemented |
| Attendance tracking | ❌ Not implemented |
| Exam/grades management | ❌ Not implemented |
| Timetable | ❌ Not implemented |
| Library management | ❌ Not implemented |
| Transport management | ❌ Not implemented |

---

## Useful Commands

```bash
# Frontend
cd school
npm install
npm run dev          # Development server
npm run build        # Production build
npm run lint         # ESLint

# Backend
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload   # Development server
alembic upgrade head             # Run migrations
```
