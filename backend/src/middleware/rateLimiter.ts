import rateLimit from "express-rate-limit";

// Applies to login/signup only. Keyed by IP address by default.
// 10 attempts per 15 minutes is generous for a real user, tight for a brute-force script.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please wait a few minutes and try again." },
});