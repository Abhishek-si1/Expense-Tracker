import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const router = Router();

const transactionSchema = z.object({
  title: z.string().min(1).max(120),
  amount: z.number().positive(),
  type: z.enum(["INCOME", "EXPENSE"]).default("EXPENSE"),
  date: z.coerce.date().default(() => new Date()),
  notes: z.string().max(500).optional(),
  categoryId: z.string().min(1),
});

const querySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().optional(),
  categoryId: z.string().optional(),
  type: z.enum(["INCOME", "EXPENSE"]).optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

async function assertOwnsCategory(userId: string | undefined, categoryId: string) {
  const category = await prisma.category.findFirst({ where: { id: categoryId, userId } });
  if (!category) throw new ApiError(400, "Category not found");
}

// GET /api/transactions?month=&year=&categoryId=&type=&search=&page=&pageSize=
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const q = querySchema.parse(req.query);

    const where: any = { userId: req.userId };
    if (q.categoryId) where.categoryId = q.categoryId;
    if (q.type) where.type = q.type;
    if (q.search) where.title = { contains: q.search, mode: "insensitive" };
    if (q.month && q.year) {
      const start = new Date(q.year, q.month - 1, 1);
      const end = new Date(q.year, q.month, 1);
      where.date = { gte: start, lt: end };
    } else if (q.year) {
      where.date = { gte: new Date(q.year, 0, 1), lt: new Date(q.year + 1, 0, 1) };
    }

    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { category: true },
        orderBy: { date: "desc" },
        skip: (q.page - 1) * q.pageSize,
        take: q.pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({ items, total, page: q.page, pageSize: q.pageSize });
  })
);

// POST /api/transactions
router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const data = transactionSchema.parse(req.body);
    await assertOwnsCategory(req.userId, data.categoryId);

    const transaction = await prisma.transaction.create({
      data: { ...data, userId: req.userId! },
      include: { category: true },
    });
    res.status(201).json(transaction);
  })
);

// PUT /api/transactions/:id
router.put(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const data = transactionSchema.partial().parse(req.body);
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw new ApiError(404, "Transaction not found");
    if (data.categoryId) await assertOwnsCategory(req.userId, data.categoryId);

    const transaction = await prisma.transaction.update({
      where: { id: req.params.id },
      data,
      include: { category: true },
    });
    res.json(transaction);
  })
);

// DELETE /api/transactions/:id
router.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.transaction.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw new ApiError(404, "Transaction not found");

    await prisma.transaction.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
