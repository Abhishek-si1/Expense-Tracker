import { Router } from "express";
import { prisma } from "../lib/prisma";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/analytics/summary?month=&year=
// Totals for income, expense, net + previous month comparison
router.get(
  "/summary",
  asyncHandler(async (req: AuthRequest, res) => {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);
    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = start;

    async function totals(gte: Date, lt: Date) {
      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId: req.userId, type: "INCOME", date: { gte, lt } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId: req.userId, type: "EXPENSE", date: { gte, lt } },
          _sum: { amount: true },
        }),
      ]);
      const inc = Number(income._sum.amount ?? 0);
      const exp = Number(expense._sum.amount ?? 0);
      return { income: inc, expense: exp, net: inc - exp };
    }

    const current = await totals(start, end);
    const previous = await totals(prevStart, prevEnd);

    res.json({ current, previous, month, year });
  })
);

// GET /api/analytics/by-category?month=&year=
router.get(
  "/by-category",
  asyncHandler(async (req: AuthRequest, res) => {
    const month = Number(req.query.month) || new Date().getMonth() + 1;
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const grouped = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId: req.userId, type: "EXPENSE", date: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    const categories = await prisma.category.findMany({
      where: { id: { in: grouped.map((g) => g.categoryId) }, userId: req.userId },
    });
    const byId = Object.fromEntries(categories.map((c) => [c.id, c]));

    const result = grouped
      .map((g) => ({
        categoryId: g.categoryId,
        name: byId[g.categoryId]?.name ?? "Unknown",
        color: byId[g.categoryId]?.color ?? "#6366f1",
        total: Number(g._sum.amount ?? 0),
      }))
      .sort((a, b) => b.total - a.total);

    res.json(result);
  })
);

// GET /api/analytics/trend?months=6
// Monthly income vs expense for the last N months (default 6)
router.get(
  "/trend",
  asyncHandler(async (req: AuthRequest, res) => {
    const months = Number(req.query.months) || 6;
    const now = new Date();
    const results: { label: string; income: number; expense: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);

      const [income, expense] = await Promise.all([
        prisma.transaction.aggregate({
          where: { userId: req.userId, type: "INCOME", date: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: { userId: req.userId, type: "EXPENSE", date: { gte: start, lt: end } },
          _sum: { amount: true },
        }),
      ]);

      results.push({
        label: start.toLocaleString("en-US", { month: "short", year: "2-digit" }),
        income: Number(income._sum.amount ?? 0),
        expense: Number(expense._sum.amount ?? 0),
      });
    }

    res.json(results);
  })
);

export default router;
