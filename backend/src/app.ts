import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import healthRoutes from "./routes/healthRoutes";
import authRoutes from "./modules/auth/authRoutes";
import onboardingRoutes from "./modules/onboarding/onboardingRoutes";
import { errorMiddleware, notFoundMiddleware } from "./middleware/errorMiddleware";

// Load environment variables as early as possible
dotenv.config();

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────

// Parse incoming JSON bodies
app.use(express.json());

// CORS — allow the Vite dev server origin (configurable via env)
const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

import skillsRoutes from "./modules/skills/skillsRoutes";
import mentorsRoutes from "./modules/mentors/mentorsRoutes";
import sessionsRoutes from "./modules/sessions/sessionsRoutes";
import walletRoutes from "./modules/wallet/walletRoutes";
import messagesRoutes from "./modules/messages/messagesRoutes";
import notificationsRoutes from "./modules/notifications/notificationsRoutes";
import reviewsRoutes from "./modules/reviews/reviewsRoutes";
import notesRoutes from "./modules/notes/notesRoutes";

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/skills", skillsRoutes);
app.use("/api/mentors", mentorsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/notes", notesRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────

// 404 — must come after all routes
app.use(notFoundMiddleware);

// Centralized error handler — must be the very last middleware
app.use(errorMiddleware);

export default app;
