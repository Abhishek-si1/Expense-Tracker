# Expense Tracker – Personal Finance Dashboard

Full-stack expense tracking dashboard with authentication, transaction logging,
category management, monthly budgets, and spending analytics.

**Live demo:** https://expense-tracker-ten-orcin-75.vercel.app
**Backend API:** https://expense-tracker-ooms.onrender.com (Render free tier — the
first request after a period of inactivity can take 30-50s to wake up)

**Stack:** React, TypeScript, Vite, Tailwind CSS, Node.js, Express.js, PostgreSQL,
Prisma, Recharts, JWT auth

## Features

**Auth**
- Email/password signup and login (JWT, bcrypt-hashed passwords)
- No-email password reset: set a security question at signup, answer it later to
  reset your password if you forget it
- Change password from the Settings tab while logged in
- Rate limiting on login/signup (10 attempts per 15 minutes per IP)
- Every category, transaction, and budget is scoped to the logged-in user

**Transactions**
- Log income or expense entries with title, amount, category, date, and notes
- Filter by search text, category, and type
- Sort by date (newest/oldest first)

**Categories**
- Create custom categories with colors
- Delete categories that aren't in use

**Budgets**
- Set a monthly budget per category
- Track spent vs. remaining amount against each budget

**Analytics dashboard**
- Income vs. expense summary for the month, compared to the previous month
- Spending-by-category pie chart
- 6-month income/expense trend bar chart
- Per-category budget progress bars

**UI**
- Light/dark mode toggle (persisted, respects system preference on first visit)
- Type-safe database access via Prisma ORM + PostgreSQL

## Project structure
```
expense-tracker/
├── backend/           Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── index.ts
│       ├── lib/prisma.ts
│       ├── middleware/
│       │   ├── auth.ts            JWT verification (requireAuth)
│       │   ├── rateLimiter.ts     login/signup rate limiting
│       │   └── errorHandler.ts
│       └── routes/
│           ├── auth.ts            signup, login, change-password, forgot-password
│           └── {categories,transactions,budgets,analytics}.ts
└── frontend/           React + Vite + TypeScript SPA
    └── src/
        ├── api/client.ts
        ├── components/
        │   ├── TransactionForm, TransactionList, CategoryManager, BudgetManager
        │   ├── ChangePasswordForm.tsx
        │   ├── ThemeToggle.tsx
        │   └── charts/
        ├── pages/
        │   ├── AuthPage.tsx        login / signup / forgot-password flow
        │   └── Dashboard.tsx
        └── types.ts
```

## Setup

### 1. Database
Create a PostgreSQL database (locally or on Neon/Supabase/Railway).

### 2. Backend
```bash
cd backend
# create backend/.env with:
#   DATABASE_URL="postgresql://user:password@localhost:5432/expense_tracker"
#   JWT_SECRET="any long random string"
#   PORT=4000
#   CORS_ORIGIN="http://localhost:5173"
npm install
npx prisma migrate dev --name init
npm run seed          # optional: seeds starter categories
npm run dev            # http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev             # http://localhost:5173 (proxies /api to :4000 in dev)
```

### Environment variables

**Backend (`backend/.env`)**
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | secret used to sign auth tokens |
| `PORT` | defaults to 4000 |
| `CORS_ORIGIN` | allowed frontend origin (e.g. your Vercel URL in production) |

**Frontend (`frontend/.env` or host's env settings)**
| Variable | Description |
|---|---|
| `VITE_API_URL` | full backend API URL, e.g. `https://your-backend.onrender.com/api` — only needed in production; dev uses Vite's proxy |

## API overview

**Auth** (`/api/auth`, all public except `change-password`)
| Method | Route | Description |
|---|---|---|
| POST | `/signup` | create account + security question, returns JWT |
| POST | `/login` | returns JWT |
| PUT | `/change-password` | requires auth; verifies current password |
| POST | `/forgot-password/questions` | step 1: look up a user's security question by email |
| POST | `/forgot-password/verify` | step 2: check the answer, returns a short-lived reset token |
| POST | `/reset-password` | step 3: consume the reset token, set a new password |

**Everything below requires a `Bearer` JWT and is scoped to the logged-in user**
| Method | Route | Description |
|---|---|---|
| GET/POST | `/api/categories` | list / create categories |
| PUT/DELETE | `/api/categories/:id` | update / delete a category |
| GET/POST | `/api/transactions` | list (filter by month/year/category/type/search) / create |
| PUT/DELETE | `/api/transactions/:id` | update / delete |
| GET/POST | `/api/budgets?month=&year=` | list with spent/remaining / upsert |
| DELETE | `/api/budgets/:id` | remove a budget |
| GET | `/api/analytics/summary?month=&year=` | income/expense/net, current vs. previous month |
| GET | `/api/analytics/by-category?month=&year=` | expense totals grouped by category |
| GET | `/api/analytics/trend?months=6` | income vs. expense per month, last N months |

## Deployment

- **Backend**: [Render](https://render.com) — build command
  `npm install && npx prisma generate && npx prisma migrate deploy`, start command
  `npm start` (runs via `ts-node`, no compile step)
- **Database**: [Neon](https://neon.tech) — serverless Postgres
- **Frontend**: [Vercel](https://vercel.com) — root directory `frontend`,
  `VITE_API_URL` set to the Render backend's `/api` URL

## Notes
This was scaffolded as a React + Vite + Express + Prisma stack (not a fork of
k-amith1610/a-expense-tracker, which is Next.js + Clerk + Drizzle — a different
framework and ORM). Budgets, transaction logging, and the analytics dashboard
were used as feature inspiration.
