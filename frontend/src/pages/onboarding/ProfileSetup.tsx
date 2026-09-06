import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import OnboardingLayout from "@/components/onboarding/OnboardingLayout";
import ProgressStepper from "@/components/onboarding/ProgressStepper";
import StepOne from "@/components/onboarding/StepOne";
import StepTwo from "@/components/onboarding/StepTwo";
import StepThree from "@/components/onboarding/StepThree";
import { useAuth } from "@/context/AuthContext";
import { useSessions } from "@/hooks/useSessions";
import type { DayAvailability } from "@/data/mentors";
import {
  onboardingApi,
  type OnboardingStatusData,
  type StepOnePayload,
  type StepTwoPayload,
} from "@/services/onboardingApi";

export default function ProfileSetup() {
  const [currentStep, setCurrentStep] = useState(1);
  const [savedData, setSavedData] = useState<OnboardingStatusData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user, updateUser } = useAuth();
  const { currentUser, updateUserProfile, updateUserAvailability } = useSessions();
  const navigate = useNavigate();

  // Load saved onboarding status to allow resuming seamlessly
  useEffect(() => {
    onboardingApi
      .getStatus()
      .then((res) => {
        if (res.success && res.data) {
          setSavedData(res.data);
          const step = Math.min(Math.max(res.data.onboardingStep || 1, 1), 3);
          setCurrentStep(step);

          const activeUserId = user?.id || currentUser.id;

          if (res.data.fullName) {
            updateUser({
              fullName: res.data.fullName,
              avatar: res.data.avatar || undefined,
              department: res.data.department || undefined,
            });
            updateUserProfile(activeUserId, {
              name: res.data.fullName,
              department: res.data.department || currentUser.department,
              year: res.data.year || currentUser.year,
              bio: res.data.bio || currentUser.bio,
              avatar: res.data.avatar || currentUser.avatar,
              teaches: res.data.teaches?.length ? res.data.teaches : currentUser.teaches,
              learns: res.data.learns?.length ? res.data.learns : currentUser.learns,
            });
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load onboarding status:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleStepOneNext = async (
    data: StepOnePayload & { github?: string; linkedin?: string; portfolio?: string }
  ) => {
    const res = await onboardingApi.savePersonal(data);
    if (res.success && res.data) {
      setSavedData(res.data);
      const activeUserId = user?.id || currentUser.id;

      updateUser({
        fullName: res.data.fullName,
        avatar: res.data.avatar || undefined,
        department: res.data.department || undefined,
        onboardingStep: res.data.onboardingStep,
      });

      // Synchronize directly with Dashboard Profile Settings
      updateUserProfile(activeUserId, {
        name: res.data.fullName,
        department: res.data.department || "Computer Science",
        year: res.data.year || "3rd Year",
        bio: res.data.bio || "",
        avatar: res.data.avatar || "",
      });

      setCurrentStep(2);
    }
  };

  const handleStepTwoNext = async (data: StepTwoPayload) => {
    const res = await onboardingApi.saveSkills(data);
    if (res.success && res.data) {
      setSavedData(res.data);
      const activeUserId = user?.id || currentUser.id;

      updateUser({
        onboardingStep: res.data.onboardingStep,
      });

      // Synchronize directly with Dashboard Skills & Interests Settings
      updateUserProfile(activeUserId, {
        teaches: res.data.teaches || [],
        teachingSkill: res.data.teaches?.[0] || "Web Development",
        learns: res.data.learns || [],
      });

      setCurrentStep(3);
    }
  };

  const handleStepThreeFinish = async (schedule: DayAvailability[]) => {
    const activeUserId = user?.id || currentUser.id;

    // 1. Sync directly with Dashboard Availability Settings
    updateUserAvailability(activeUserId, schedule);

    // 2. Summarize availability for preferences API
    const activeDays = schedule.filter((s) => s.enabled).map((s) => s.day).join(", ");
    const res = await onboardingApi.savePreferences({
      availability: activeDays || "Flexible",
      preferredTime: "Evening",
    });

    if (res.success && res.data) {
      setSavedData(res.data);
      updateUser({
        onboardingCompleted: true,
        onboardingStep: 3,
      });
      // Redirect straight to Dashboard
      navigate("/dashboard");
    }
  };

  const renderStep = () => {
    if (isLoading) {
      return (
        <div className="rounded-3xl border border-violet-100 bg-white p-12 text-center text-gray-500 shadow-sm max-w-xl mx-auto">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
          <p className="font-medium text-sm">Loading your profile setup...</p>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <StepOne
            initialData={{
              fullName: savedData?.fullName || user?.fullName || currentUser.name || "",
              registrationNumber: savedData?.registrationNumber || "",
              university: savedData?.university || "VIT Chennai",
              department: savedData?.department || currentUser.department || "",
              year: savedData?.year || currentUser.year || "",
              phone: savedData?.phone || "",
              bio: savedData?.bio || currentUser.bio || "",
              avatar: savedData?.avatar || user?.avatar || currentUser.avatar || "",
              github: savedData?.github || "",
              linkedin: savedData?.linkedin || "",
              portfolio: savedData?.portfolio || "",
            }}
            onNext={handleStepOneNext}
          />
        );

      case 2:
        return (
          <StepTwo
            initialData={{
              teaches: savedData?.teaches?.length ? savedData.teaches : currentUser.teaches,
              learns: savedData?.learns?.length ? savedData.learns : currentUser.learns,
            }}
            onBack={() => setCurrentStep(1)}
            onNext={handleStepTwoNext}
          />
        );

      case 3:
        return (
          <StepThree
            initialSchedule={currentUser.availability}
            onBack={() => setCurrentStep(2)}
            onFinish={handleStepThreeFinish}
          />
        );

      default:
        return null;
    }
  };

  return (
    <OnboardingLayout>
      <ProgressStepper currentStep={currentStep} />
      <div className="mt-8">{renderStep()}</div>
    </OnboardingLayout>
  );
}