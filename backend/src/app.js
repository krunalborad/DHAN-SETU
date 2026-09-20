import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import holdingRoutes from "./routes/holdingRoutes.js";
import watchlistRoutes from "./routes/watchlistRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import dividendRoutes from "./routes/dividendRoutes.js";
import { requireAuth } from "./middleware/auth.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim());

  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json());

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  // Public (register/login). /api/auth/me is protected inside authRoutes.js itself.
  app.use("/api/auth", authRoutes);

  // Protected — everything below requires a valid JWT
  app.use("/api/holdings", requireAuth, holdingRoutes);
  app.use("/api/watchlist", requireAuth, watchlistRoutes);
  app.use("/api/alerts", requireAuth, alertRoutes);
  app.use("/api/dividends", requireAuth, dividendRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
