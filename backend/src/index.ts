import "dotenv/config";
import express from "express";
import cors from "cors";
import authRouter from "./routes/auth";
import categoriesRouter from "./routes/categories";
import transactionsRouter from "./routes/transactions";
import budgetsRouter from "./routes/budgets";
import analyticsRouter from "./routes/analytics";
import { errorHandler } from "./middleware/errorHandler";
import { requireAuth } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 4000;

// Render (and most hosts) sit behind a reverse proxy; trusting the first hop
// lets express-rate-limit read the real client IP from X-Forwarded-For.
app.set("trust proxy", 1);

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);

app.use("/api/categories", requireAuth, categoriesRouter);
app.use("/api/transactions", requireAuth, transactionsRouter);
app.use("/api/budgets", requireAuth, budgetsRouter);
app.use("/api/analytics", requireAuth, analyticsRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});