import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  isValidEmailFormat,
  normalizeEmail,
} from "@/utils/vitEmailValidation";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (googleData: { email: string; name: string; avatar?: string }) => void;
}

export default function GoogleAuthModal({
  isOpen,
  onClose,
  onSuccess,
}: GoogleAuthModalProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      setError("Please enter your Google account email.");
      return;
    }

    if (!isValidEmailFormat(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const cleanName = name.trim() || cleanEmail.split("@")[0] || "User";
    setIsSubmitting(true);
    onSuccess({
      email: cleanEmail,
      name: cleanName,
      avatar: cleanName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <FcGoogle className="h-7 w-7" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Sign in with Google</h3>
            <p className="text-xs text-gray-500">Sign in with any verified Google account</p>
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Custom Google Account Entry */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <div>
            <Label htmlFor="google-name" className="text-xs">Full Name</Label>
            <Input
              id="google-name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-10"
            />
          </div>

          <div>
            <Label htmlFor="google-email" className="text-xs">Google Email</Label>
            <Input
              id="google-email"
              type="email"
              placeholder="e.g. name@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 h-10"
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 h-10 w-full bg-violet-600 text-white hover:bg-violet-700"
          >
            {isSubmitting ? "Authenticating..." : "Continue with this Account"}
          </Button>
        </form>
      </div>
    </div>
  );
}
