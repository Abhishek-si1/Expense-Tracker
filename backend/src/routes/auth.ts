import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { asyncHandler, ApiError } from "../middleware/errorHandler";
import { authRateLimiter } from "../middleware/rateLimiter";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();

const securityQuestionSchema = z.object({
  question: z.string().min(5).max(150),
  answer: z.string().min(2).max(100),
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(100),
  name: z.string().min(1).max(80).optional(),
  securityQuestions: z.array(securityQuestionSchema).length(1),
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

// Normalize answers so "Blue", " blue ", "BLUE" all match the same hash
function normalizeAnswer(answer: string) {
  return answer.trim().toLowerCase();
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
    const questionHashes = await Promise.all(
      data.securityQuestions.map((q) => bcrypt.hash(normalizeAnswer(q.answer), 10))
    );

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        securityQuestions: {
          create: data.securityQuestions.map((q, i) => ({
            question: q.question,
            answerHash: questionHashes[i],
            order: i + 1,
          })),
        },
      },
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

// PUT /api/auth/change-password  (logged in)
router.put(
  "/change-password",
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const schema = z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(6).max(100),
    });
    const data = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) throw new ApiError(404, "User not found");

    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) throw new ApiError(401, "Current password is incorrect");

    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.json({ success: true });
  })
);

// POST /api/auth/forgot-password/questions  { email }
// Step 1 of the no-email reset flow: return this user's security questions (not answers).
router.post(
  "/forgot-password/questions",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { securityQuestions: { orderBy: { order: "asc" } } },
    });
    if (!user || user.securityQuestions.length === 0) {
      throw new ApiError(404, "No account found with security questions for this email.");
    }

    res.json({
      questions: user.securityQuestions.map((q) => ({ id: q.id, question: q.question })),
    });
  })
);

// POST /api/auth/forgot-password/verify  { email, answers: [{ questionId, answer }] }
// Step 2: check all 5 answers, issue a short-lived reset token if correct.
router.post(
  "/forgot-password/verify",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      email: z.string().email(),
      answers: z.array(z.object({ questionId: z.string(), answer: z.string() })).length(1),
    });
    const data = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: { securityQuestions: true },
    });
    if (!user) throw new ApiError(404, "No account found with this email.");

    const byId = Object.fromEntries(user.securityQuestions.map((q) => [q.id, q]));

    for (const a of data.answers) {
      const q = byId[a.questionId];
      if (!q) throw new ApiError(400, "One or more answers are incorrect.");
      const match = await bcrypt.compare(normalizeAnswer(a.answer), q.answerHash);
      if (!match) throw new ApiError(401, "One or more answers are incorrect.");
    }

    const resetToken = jwt.sign(
      { userId: user.id, purpose: "password-reset" },
      process.env.JWT_SECRET || "dev-secret",
      { expiresIn: "15m" }
    );
    res.json({ resetToken });
  })
);

// POST /api/auth/reset-password  { resetToken, newPassword }
// Step 3: consume the reset token from step 2 and set the new password.
router.post(
  "/reset-password",
  authRateLimiter,
  asyncHandler(async (req, res) => {
    const schema = z.object({
      resetToken: z.string(),
      newPassword: z.string().min(6).max(100),
    });
    const data = schema.parse(req.body);

    let payload: { userId: string; purpose: string };
    try {
      payload = jwt.verify(data.resetToken, process.env.JWT_SECRET || "dev-secret") as typeof payload;
    } catch {
      throw new ApiError(401, "This reset link has expired. Please start over.");
    }
    if (payload.purpose !== "password-reset") {
      throw new ApiError(401, "Invalid reset token");
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    await prisma.user.update({ where: { id: payload.userId }, data: { passwordHash } });

    res.json({ success: true });
  })
);

export default router;