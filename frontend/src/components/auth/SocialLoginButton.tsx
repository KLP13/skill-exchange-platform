import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    google?: any;
  }
}

interface SocialLoginButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

export default function SocialLoginButton({
  onClick,
  disabled = false,
}: SocialLoginButtonProps) {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const rawClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const isConfigured =
    rawClientId &&
    rawClientId !== "your_google_client_id_here.apps.googleusercontent.com" &&
    !rawClientId.includes("vitskillswapoauthclientid2026");

  const googleClientId = rawClientId;

  // Initialize Google Identity Services if a valid Client ID is provided
  useEffect(() => {
    if (isConfigured && window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        context: "signin",
      });
    }
  }, [googleClientId, isConfigured]);

  async function handleGoogleCredentialResponse(response: any) {
    setIsLoading(true);
    setAuthError(null);
    try {
      if (!response.credential) {
        throw new Error("No credential received from Google.");
      }

      const user = await loginWithGoogle({
        credential: response.credential,
      });

      if (!user.onboardingCompleted) {
        navigate("/profile-setup");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Please use your VIT email account to continue.";
      setAuthError(message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleGoogleClick() {
    setAuthError(null);
    onClick?.();

    if (!isConfigured) {
      setAuthError(
        "Google Client ID is not configured yet. Please create a Client ID in Google Cloud Console and paste it into frontend/.env (VITE_GOOGLE_CLIENT_ID) and backend/.env (GOOGLE_CLIENT_ID)."
      );
      return;
    }

    // Trigger official Google OAuth Account Chooser
    if (window.google?.accounts?.oauth2) {
      setIsLoading(true);
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "email profile openid",
          prompt: "select_account", // Explicitly show Google Account Chooser
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setIsLoading(false);
              if (tokenResponse.error !== "popup_closed_by_user") {
                setAuthError("Google authentication cancelled or failed.");
              }
              return;
            }

            try {
              const user = await loginWithGoogle({
                accessToken: tokenResponse.access_token,
              });

              if (!user.onboardingCompleted) {
                navigate("/profile-setup");
              } else {
                navigate("/dashboard");
              }
            } catch (err: any) {
              const message =
                err.response?.data?.message ||
                err.message ||
                "Please use your VIT email account to continue.";
              setAuthError(message);
            } finally {
              setIsLoading(false);
            }
          },
        });
        client.requestAccessToken();
      } catch (err: any) {
        setIsLoading(false);
        setAuthError(err.message || "Failed to initialize Google Sign-In.");
      }
    } else if (window.google?.accounts?.id) {
      // Fallback to Google ID One-Tap Prompt
      window.google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setIsLoading(false);
        }
      });
    } else {
      setAuthError(
        "Google Sign-In service is initializing. Please check your internet connection and try again."
      );
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full h-12 text-base font-medium cursor-pointer relative"
        onClick={handleGoogleClick}
        disabled={disabled || isLoading}
      >
        <FcGoogle className="mr-3 h-5 w-5" />
        {isLoading ? "Signing in with Google..." : "Continue with Google"}
      </Button>

      {authError && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-700 leading-relaxed"
          role="alert"
          aria-live="polite"
        >
          {authError}
        </div>
      )}
    </div>
  );
}