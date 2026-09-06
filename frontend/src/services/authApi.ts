import api from "./api";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  department?: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  credits: number;
}

export interface AuthApiResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    user: AuthUser;
  };
}

export const authApi = {
  /**
   * Request 6-digit OTP verification code for new email/password signup
   */
  async requestSignupVerification(
    fullName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; data: { email: string } }> {
    const res = await api.post("/auth/signup/request-verification", {
      fullName,
      email,
      password,
    });
    return res.data;
  },

  /**
   * Submit OTP and complete signup with +40 credits
   */
  async verifySignupOtp(email: string, otp: string): Promise<AuthApiResponse> {
    const res = await api.post<AuthApiResponse>("/auth/signup/verify", {
      email,
      otp,
    });
    return res.data;
  },

  /**
   * Email + Password Login
   */
  async login(email: string, password: string): Promise<AuthApiResponse> {
    const res = await api.post<AuthApiResponse>("/auth/login", {
      email,
      password,
    });
    return res.data;
  },

  /**
   * Real Google Authentication (with Google credential or token)
   */
  async googleAuth(payload: {
    credential?: string;
    idToken?: string;
    accessToken?: string;
    email?: string;
    name?: string;
    avatar?: string;
    googleId?: string;
  }): Promise<AuthApiResponse> {
    const res = await api.post<AuthApiResponse>("/auth/google", payload);
    return res.data;
  },

  /**
   * Fetch authenticated user info
   */
  async getMe(): Promise<{ success: boolean; data: AuthUser }> {
    const res = await api.get<{ success: boolean; data: AuthUser }>("/auth/me");
    return res.data;
  },
};
