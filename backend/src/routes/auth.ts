import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { authRateLimiter } from "../middleware/rateLimiter";

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(80).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(100),
});

function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "7d",
  });
}

// POST /api/auth/signup
router.post(
  "/signup",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const data = signupSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ApiError(409, "An account with this email already exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, name: data.name },
    });

    res.status(201).json({
      token: signToken(user.id),
      user: { id: user.id, email: user.email, name: user.name },
    });
  })
);

// POST /api/auth/login
router.post(
  "/login",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user) {
      throw new ApiError(404, "No account found with this email. Please sign up.");
    }

    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, "Incorrect password. Please try again.");
    }

    res.json({
      token: signToken(user.id),
      user: { id: user.id, email: user.email, name: user.name },
    });
  })
);

export default router;