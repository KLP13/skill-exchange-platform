import { Router } from "express";
import {
  requestVerification,
  verifyOtpAndCreateAccount,
  login,
  googleAuth,
  getProfile,
} from "./authController";
import { requireAuth } from "./authMiddleware";

const router = Router();

// Signup Email Verification Flow (OTP)
router.post("/signup/request-verification", requestVerification);
router.post("/signup/verify", verifyOtpAndCreateAccount);

// Legacy signup alias for request-verification
router.post("/signup", requestVerification);

// Email/Password login
router.post("/login", login);

// Real Google OAuth / GIS login & signup
router.post("/google", googleAuth);

// Authenticated user profile (Me)
router.get("/me", requireAuth, getProfile);

export default router;
