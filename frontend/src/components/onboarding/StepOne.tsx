import { useState, useEffect } from "react";
import { Camera, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { StepOnePayload } from "@/services/onboardingApi";

interface StepOneProps {
  initialData?: StepOnePayload & {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  onNext: (data: StepOnePayload & { github?: string; linkedin?: string; portfolio?: string }) => Promise<void>;
}

const VIT_DEPARTMENTS = [
  "Computer Science & Engineering (SCOPE)",
  "Information Technology & Engineering",
  "Electronics & Communication (SENSE)",
  "Electrical & Electronics (SELECT)",
  "Mechanical Engineering (SMEC)",
  "Civil Engineering",
  "Biotechnology & Bioengineering",
  "Data Science & AI",
  "Business & Management (VITBS)",
  "Fashion & Design (V-SIGN)",
  "Law School (VITSOL)",
];

const ACADEMIC_YEARS = [
  "1st Year (Freshman)",
  "2nd Year (Sophomore)",
  "3rd Year (Junior)",
  "4th Year (Senior)",
  "Postgraduate / M.Tech / MBA",
  "PhD / Research Scholar",
];

export default function StepOne({ initialData, onNext }: StepOneProps) {
  const [fullName, setFullName] = useState(initialData?.fullName || "");
  const [registrationNumber, setRegistrationNumber] = useState(
    initialData?.registrationNumber || ""
  );
  const [department, setDepartment] = useState(
    initialData?.department || VIT_DEPARTMENTS[0]
  );
  const [year, setYear] = useState(initialData?.year || ACADEMIC_YEARS[2]);
  const [bio, setBio] = useState(initialData?.bio || "");
  const [avatar, setAvatar] = useState(initialData?.avatar || "");
  const [github, setGithub] = useState(initialData?.github || "");
  const [linkedin, setLinkedin] = useState(initialData?.linkedin || "");
  const [portfolio, setPortfolio] = useState(initialData?.portfolio || "");
  const [showSocials, setShowSocials] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      if (initialData.fullName) setFullName(initialData.fullName);
      if (initialData.registrationNumber) setRegistrationNumber(initialData.registrationNumber);
      if (initialData.department) setDepartment(initialData.department);
      if (initialData.year) setYear(initialData.year);
      if (initialData.bio) setBio(initialData.bio);
      if (initialData.avatar) setAvatar(initialData.avatar);
      if (initialData.github) setGithub(initialData.github);
      if (initialData.linkedin) setLinkedin(initialData.linkedin);
      if (initialData.portfolio) setPortfolio(initialData.portfolio);
    }
  }, [initialData]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = async () => {
    setError(null);
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!registrationNumber.trim()) {
      setError("Please enter your registration number.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onNext({
        fullName,
        registrationNumber,
        university: "VIT Chennai",
        department,
        year,
        phone: "",
        bio,
        avatar,
        github,
        linkedin,
        portfolio,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save personal information.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-violet-100 bg-white p-6 sm:p-10 shadow-sm max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 1 of 3: Your Campus Identity</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Personal & Academic Profile
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Set up how your VIT peers and mentors will see you on SkillSwap.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Profile Photo */}
      <div className="mb-8 flex justify-center">
        <label className="group relative cursor-pointer text-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />

          <div className="relative mx-auto flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-3 border-dashed border-violet-300 bg-violet-50/70 transition-all duration-300 group-hover:border-violet-500 group-hover:bg-violet-100 shadow-xs">
            {avatar ? (
              <img
                src={avatar}
                alt="Profile Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <Camera className="h-8 w-8 text-violet-500" />
            )}
          </div>

          <div className="mt-2.5 text-xs font-semibold text-violet-600 hover:text-violet-700">
            {avatar ? "Change Photo" : "Upload Profile Photo"}
          </div>
        </label>
      </div>

      {/* Form Fields */}
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label htmlFor="step1-fullname" className="text-xs font-semibold text-gray-700">
            Full Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="step1-fullname"
            placeholder="e.g. Gnanith Pathi"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="h-11"
          />
        </div>

        {/* Registration Number */}
        <div className="space-y-1.5">
          <Label htmlFor="step1-regno" className="text-xs font-semibold text-gray-700">
            Registration Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="step1-regno"
            placeholder="e.g. 23BCE1042"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value.toUpperCase())}
            className="h-11 font-mono uppercase"
          />
        </div>

        {/* Department */}
        <div className="space-y-1.5">
          <Label htmlFor="step1-dept" className="text-xs font-semibold text-gray-700">
            Department / School
          </Label>
          <select
            id="step1-dept"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {VIT_DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Year of Study */}
        <div className="space-y-1.5">
          <Label htmlFor="step1-year" className="text-xs font-semibold text-gray-700">
            Academic Year
          </Label>
          <select
            id="step1-year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {ACADEMIC_YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bio */}
      <div className="mt-5 space-y-1.5">
        <Label htmlFor="step1-bio" className="text-xs font-semibold text-gray-700">
          About You / Short Bio
        </Label>
        <Textarea
          id="step1-bio"
          placeholder="Share what you are passionate about, topics you teach, or skills you want to explore..."
          className="min-h-24 resize-none text-sm"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
      </div>

      {/* Collapsible Social / Portfolio Links */}
      <div className="mt-6 border-t border-gray-100 pt-4">
        <button
          type="button"
          onClick={() => setShowSocials((prev) => !prev)}
          className="flex items-center justify-between w-full text-xs font-semibold text-violet-700 hover:text-violet-800 py-1"
        >
          <span>{showSocials ? "− Hide Social / Portfolio Links (Optional)" : "+ Add GitHub, LinkedIn, or Portfolio Link (Optional)"}</span>
          {showSocials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showSocials && (
          <div className="grid gap-4 sm:grid-cols-3 mt-4 pt-2">
            <div className="space-y-1">
              <Label htmlFor="step1-github" className="text-[11px] font-medium text-gray-600">
                GitHub URL
              </Label>
              <Input
                id="step1-github"
                placeholder="https://github.com/..."
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="step1-linkedin" className="text-[11px] font-medium text-gray-600">
                LinkedIn URL
              </Label>
              <Input
                id="step1-linkedin"
                placeholder="https://linkedin.com/in/..."
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="step1-portfolio" className="text-[11px] font-medium text-gray-600">
                Portfolio Website
              </Label>
              <Input
                id="step1-portfolio"
                placeholder="https://yourportfolio.dev"
                value={portfolio}
                onChange={(e) => setPortfolio(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="h-11 cursor-pointer rounded-xl bg-violet-600 px-8 hover:bg-violet-700 font-medium text-sm shadow-xs"
        >
          {isSubmitting ? "Saving..." : "Continue to Skills →"}
        </Button>
      </div>
    </div>
  );
}