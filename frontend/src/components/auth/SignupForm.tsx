import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Mail, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import {
  isValidEmailFormat,
  isVitEmail,
  normalizeEmail,
  VIT_EMAIL_ERROR,
} from "@/utils/vitEmailValidation";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  otp?: string;
  general?: string;
}

export default function SignupForm() {
  const [step, setStep] = useState<"details" | "otp">("details");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { requestSignupVerification, verifySignupOtp } = useAuth();
  const navigate = useNavigate();

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  function validateDetails(): FormErrors {
    const newErrors: FormErrors = {};
    const normalizedEmail = normalizeEmail(email);

    if (!name.trim()) {
      newErrors.name = "Full name is required.";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!isValidEmailFormat(normalizedEmail)) {
      newErrors.email = "Please enter a valid email address.";
    } else if (!isVitEmail(normalizedEmail)) {
      newErrors.email = VIT_EMAIL_ERROR;
    }

    if (!password) {
      newErrors.password = "Password is required.";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long.";
    }

    return newErrors;
  }

  // Handle Step 1: Request OTP
  async function handleRequestOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSuccessInfo(null);

    const validationErrors = validateDetails();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await requestSignupVerification(name, email, password);
      setStep("otp");
      setResendCooldown(30);
      setSuccessInfo(res.message || `Verification code sent to ${normalizeEmail(email)}`);
      // Focus first OTP input after switching
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "An error occurred while sending the verification code. Please try again.";
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Step 2: Verify OTP
  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setSuccessInfo(null);

    const fullOtp = otp.join("").trim();
    if (fullOtp.length !== 6) {
      setErrors({ otp: "Please enter the complete 6-digit verification code." });
      return;
    }

    setIsSubmitting(true);
    try {
      await verifySignupOtp(email, fullOtp);
      // Account created with +40 credits -> redirect to onboarding step 1
      navigate("/profile-setup");
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Verification failed. Please check the code and try again.";
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Resend OTP
  async function handleResendCode() {
    if (resendCooldown > 0 || isSubmitting) return;
    setErrors({});
    setSuccessInfo(null);
    setIsSubmitting(true);
    try {
      const res = await requestSignupVerification(name, email, password);
      setResendCooldown(30);
      setSuccessInfo(res.message || "A new verification code has been sent.");
      setOtp(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to resend code. Please try again later.";
      setErrors({ general: message });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle OTP individual input
  function handleOtpChange(index: number, value: string) {
    // If pasted multi-digit text
    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(digits.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    if (errors.otp) setErrors((prev) => ({ ...prev, otp: undefined }));
    if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  }

  // -------------------------------------------------------------
  // STEP 2: OTP VERIFICATION UI
  // -------------------------------------------------------------
  if (step === "otp") {
    return (
      <form className="space-y-5" onSubmit={handleVerifyOtp} noValidate>
        {/* Verification Header Banner */}
        <div className="rounded-xl border border-violet-100 bg-violet-50/70 p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Mail className="h-5 w-5" />
          </div>
          <h3 className="text-sm font-semibold text-violet-900">Verify Your VIT Email</h3>
          <p className="mt-1 text-xs text-violet-700">
            We sent a 6-digit verification code to:
          </p>
          <p className="mt-0.5 text-xs font-mono font-semibold text-violet-950">
            {normalizeEmail(email)}
          </p>
        </div>

        {/* General Error Banner */}
        {errors.general && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {errors.general}
          </div>
        )}

        {/* Success Notice */}
        {successInfo && (
          <div
            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800"
            role="status"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* OTP Input Fields */}
        <div className="space-y-2">
          <Label className="text-center block text-sm font-medium text-gray-700">
            Enter 6-Digit Code
          </Label>
          <div className="flex justify-between gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  otpInputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                className="h-13 w-11 rounded-lg border border-gray-300 bg-white text-center font-mono text-xl font-bold text-gray-900 shadow-xs focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 focus:outline-hidden transition-all sm:h-14 sm:w-13"
                autoComplete="one-time-code"
              />
            ))}
          </div>
          {errors.otp && (
            <p className="text-center text-sm text-red-600" role="alert">
              {errors.otp}
            </p>
          )}
        </div>

        {/* Bonus Incentive Tag */}
        <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50/60 py-2 rounded-lg border border-emerald-100">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>+40 Initial Welcome Credits will be unlocked upon verification!</span>
        </div>

        {/* Submit Verification */}
        <Button
          type="submit"
          disabled={isSubmitting || otp.join("").length !== 6}
          className="h-12 w-full bg-violet-600 hover:bg-violet-700 cursor-pointer font-medium"
        >
          {isSubmitting ? "Verifying Code..." : "Verify & Activate Account"}
        </Button>

        {/* Resend Code & Back Controls */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setStep("details");
              setErrors({});
              setSuccessInfo(null);
            }}
            className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Edit details / email
          </button>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || isSubmitting}
            className={`flex items-center gap-1 font-semibold ${
              resendCooldown > 0
                ? "text-gray-400 cursor-not-allowed"
                : "text-violet-600 hover:text-violet-700 cursor-pointer"
            }`}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSubmitting ? "animate-spin" : ""}`} />
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
          </button>
        </div>
      </form>
    );
  }

  // -------------------------------------------------------------
  // STEP 1: INITIAL SIGNUP DETAILS UI
  // -------------------------------------------------------------
  return (
    <form className="space-y-5" onSubmit={handleRequestOtp} noValidate>
      {/* General Error Banner */}
      {errors.general && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errors.general}
        </div>
      )}

      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="signup-name">Full Name</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="Enter your full name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            if (errors.general) setErrors((prev) => ({ ...prev, general: undefined }));
          }}
          aria-describedby={errors.name ? "signup-name-error" : undefined}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p
            id="signup-name-error"
            className="text-sm text-red-600"
            role="alert"
          >
            {errors.name}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="Enter your email (e.g. name@example.com)"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email)
              setErrors((prev) => ({ ...prev, email: undefined }));
            if (errors.general)
              setErrors((prev) => ({ ...prev, general: undefined }));
          }}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
          <p
            id="signup-email-error"
            className="text-sm text-red-600"
            role="alert"
          >
            {errors.email}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>

        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Create a password (min. 6 characters)"
            className="pr-10"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password)
                setErrors((prev) => ({ ...prev, password: undefined }));
              if (errors.general)
                setErrors((prev) => ({ ...prev, general: undefined }));
            }}
            aria-describedby={
              errors.password ? "signup-password-error" : undefined
            }
            aria-invalid={!!errors.password}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>

        {errors.password && (
          <p
            id="signup-password-error"
            className="text-sm text-red-600"
            role="alert"
          >
            {errors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-12 w-full bg-violet-600 hover:bg-violet-700 cursor-pointer font-medium"
      >
        {isSubmitting ? "Sending Verification Code..." : "Create Account"}
      </Button>
    </form>
  );
}