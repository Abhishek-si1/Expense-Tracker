# Expense Tracker – Personal Finance Dashboard

Full-stack expense tracking dashboard with transaction logging, category
management, monthly budgets, and spending analytics.

**Stack:** React, TypeScript, Vite, Node.js, Express.js, PostgreSQL, Prisma, Recharts

## Features
- Transaction logging (income & expense) with category tagging, notes, and search/filter
- Category management (create, color-code, delete unused categories)
- Monthly budgets per category, with spent/remaining tracking
- Analytics dashboard: income vs. expense summary, spending-by-category pie chart,
  6-month income/expense trend bar chart, and per-category budget progress bars
- Type-safe database access via Prisma ORM + PostgreSQL

## Project structure
```
expense-tracker/
├── backend/           Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── index.ts
│       ├── lib/prisma.ts
│       ├── middleware/errorHandler.ts
│       └── routes/{categories,transactions,budgets,analytics}.ts
└── frontend/           React + Vite + TypeScript SPA
    └── src/
        ├── api/client.ts
        ├── components/ (TransactionForm, TransactionList, CategoryManager, BudgetManager, charts/)
        ├── pages/Dashboard.tsx
        └── types.ts
```

## Setup

### 1. Database
Create a PostgreSQL database (locally or e.g. on Neon/Supabase/Railway).

### 2. Backend
```bash
cd backend
cp .env.example .env      # fill in DATABASE_URL
npm install
npx prisma migrate dev --name init
npm run seed               # optional: seeds starter categories
npm run dev                 # http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173 (proxies /api to :4000)
```

## API overview
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

## Notes
This was scaffolded as a React + Vite + Express + Prisma stack (not a fork of
k-amith1610/a-expense-tracker, which is Next.js + Clerk + Drizzle — a different
framework and ORM). Budgets, transaction logging, and the analytics dashboard
were used as feature inspiration.
