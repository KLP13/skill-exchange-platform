import { Request, Response } from "express";
import {
  requestSignupVerification,
  verifySignupOtp,
  loginWithEmailPassword,
  authenticateGoogle,
  getMe,
} from "./authService";

/**
 * Step 1 of Signup: Validate input, generate 6-digit OTP, send email
 */
export async function requestVerification(req: Request, res: Response): Promise<void> {
  try {
    const { fullName, email, password } = req.body;
    const result = await requestSignupVerification(fullName, email, password);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        email: result.email,
      },
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "An error occurred while sending the verification code.";
    res.status(status).json({ success: false, message });
  }
}

/**
 * Step 2 of Signup: Verify OTP and create real SkillSwap account + wallet (+40 credits)
 */
export async function verifyOtpAndCreateAccount(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp } = req.body;
    const result = await verifySignupOtp(email, otp);

    res.status(201).json({
      success: true,
      message: "Account created successfully! Welcome to SkillSwap with +40 credits.",
      data: result,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "An error occurred during verification.";
    res.status(status).json({ success: false, message });
  }
}

/**
 * Email + Password Login
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await loginWithEmailPassword(email, password);

    res.status(200).json({
      success: true,
      message: "Signed in successfully.",
      data: result,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "An error occurred during sign in.";
    res.status(status).json({ success: false, message });
  }
}

/**
 * Google Authentication (Login / Signup)
 */
export async function googleAuth(req: Request, res: Response): Promise<void> {
  try {
    const { credential, idToken, accessToken, email, name, avatar, googleId } = req.body;
    const result = await authenticateGoogle({
      credential,
      idToken,
      accessToken,
      email,
      name,
      avatar,
      googleId,
    });

    res.status(200).json({
      success: true,
      message: "Google authentication successful.",
      data: result,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "An error occurred during Google authentication.";
    res.status(status).json({ success: false, message });
  }
}

/**
 * Get Current User Profile (Me)
 */
export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ success: false, message: "Unauthorized." });
      return;
    }

    const user = await getMe(req.user.userId);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    const status = error.status || 500;
    const message = error.message || "An error occurred fetching profile.";
    res.status(status).json({ success: false, message });
  }
}
