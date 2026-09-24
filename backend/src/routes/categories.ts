import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#([0-9a-fA-F]{6})$/).default("#6366f1"),
  icon: z.string().min(1).max(30).default("tag"),
});

// GET /api/categories
router.get(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId },
      orderBy: { name: "asc" },
      include: { _count: { select: { transactions: true } } },
    });
    res.json(categories);
  })
);

// POST /api/categories
router.post(
  "/",
  asyncHandler(async (req: AuthRequest, res) => {
    const data = categorySchema.parse(req.body);
    const category = await prisma.category.create({
      data: { ...data, userId: req.userId! },
    });
    res.status(201).json(category);
  })
);

// PUT /api/categories/:id
router.put(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const data = categorySchema.partial().parse(req.body);
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw new ApiError(404, "Category not found");

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
    });
    res.json(category);
  })
);

// DELETE /api/categories/:id
router.delete(
  "/:id",
  asyncHandler(async (req: AuthRequest, res) => {
    const existing = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!existing) throw new ApiError(404, "Category not found");

    const inUse = await prisma.transaction.count({
      where: { categoryId: req.params.id },
    });
    if (inUse > 0) {
      throw new ApiError(409, "Cannot delete a category that has transactions");
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
