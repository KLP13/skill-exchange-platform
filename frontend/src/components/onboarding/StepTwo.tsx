import { useState, useEffect } from "react";
import { X, Plus, Sparkles, BookOpen, GraduationCap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { StepTwoPayload } from "@/services/onboardingApi";

interface StepTwoProps {
  initialData?: StepTwoPayload;
  onBack: () => void;
  onNext: (data: StepTwoPayload) => Promise<void>;
}

const POPULAR_TEACH_SUGGESTIONS = [
  "Python",
  "Data Structures & Algorithms",
  "React.js",
  "Java & OOPs",
  "Machine Learning",
  "C++ Programming",
  "Figma / UI Design",
  "SQL & Databases",
  "Web Development",
  "Cloud Computing",
];

const POPULAR_LEARN_SUGGESTIONS = [
  "Artificial Intelligence",
  "DevOps & Docker",
  "System Design",
  "Mobile App Development",
  "Cybersecurity",
  "Blockchain",
  "Competitive Programming",
  "Next.js / Fullstack",
  "Natural Language Processing",
];

export default function StepTwo({
  initialData,
  onBack,
  onNext,
}: StepTwoProps) {
  const [teachingSkills, setTeachingSkills] = useState<string[]>(
    initialData?.teaches && initialData.teaches.length > 0
      ? initialData.teaches
      : ["Python", "Data Structures & Algorithms"]
  );
  const [learningSkills, setLearningSkills] = useState<string[]>(
    initialData?.learns && initialData.learns.length > 0
      ? initialData.learns
      : ["Machine Learning", "System Design"]
  );

  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [newLearnSkill, setNewLearnSkill] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      if (initialData.teaches && initialData.teaches.length > 0) {
        setTeachingSkills(initialData.teaches);
      }
      if (initialData.learns && initialData.learns.length > 0) {
        setLearningSkills(initialData.learns);
      }
    }
  }, [initialData]);

  const addTeachSkill = (skillToAdd?: string) => {
    const raw = skillToAdd || newTeachSkill;
    const trimmed = raw.trim();
    if (trimmed && !teachingSkills.includes(trimmed)) {
      setTeachingSkills([...teachingSkills, trimmed]);
      if (!skillToAdd) setNewTeachSkill("");
    }
  };

  const removeTeachSkill = (skillToRemove: string) => {
    setTeachingSkills(teachingSkills.filter((s) => s !== skillToRemove));
  };

  const addLearnSkill = (skillToAdd?: string) => {
    const raw = skillToAdd || newLearnSkill;
    const trimmed = raw.trim();
    if (trimmed && !learningSkills.includes(trimmed)) {
      setLearningSkills([...learningSkills, trimmed]);
      if (!skillToAdd) setNewLearnSkill("");
    }
  };

  const removeLearnSkill = (skillToRemove: string) => {
    setLearningSkills(learningSkills.filter((s) => s !== skillToRemove));
  };

  const handleNext = async () => {
    setError(null);
    if (teachingSkills.length === 0 && learningSkills.length === 0) {
      setError("Please add at least one skill you can teach or want to learn.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onNext({
        teaches: teachingSkills,
        learns: learningSkills,
      });
    } catch (err: any) {
      setError(err.message || "Failed to save skills and interests.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-violet-100 bg-white p-6 sm:p-10 shadow-sm max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 2 of 3: Skill Exchange Matching</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Skills & Interests
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Select what you can mentor others in, and topics you want to learn.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 1. Skills You Can Teach */}
      <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div>
            <Label className="text-base font-bold text-violet-950">
              Skills You Can Teach (Mentoring)
            </Label>
            <p className="text-xs text-violet-700">Other students will be able to request 1-on-1 peer sessions from you in these topics.</p>
          </div>
        </div>

        {/* Custom Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Type a skill and press Enter..."
            value={newTeachSkill}
            onChange={(e) => setNewTeachSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTeachSkill();
              }
            }}
            className="h-10 bg-white"
          />
          <Button
            type="button"
            onClick={() => addTeachSkill()}
            className="shrink-0 bg-violet-600 hover:bg-violet-700 h-10 px-4 text-xs font-medium cursor-pointer"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {/* Active Teaching Badges */}
        <div className="flex flex-wrap gap-2 pt-1 min-h-[36px]">
          {teachingSkills.map((skill) => (
            <div
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeTeachSkill(skill)}
                className="rounded-full p-0.5 hover:bg-violet-700 cursor-pointer"
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {teachingSkills.length === 0 && (
            <p className="text-xs text-violet-400 italic">No teaching skills selected yet.</p>
          )}
        </div>

        {/* Quick-add suggestions */}
        <div className="pt-2 border-t border-violet-200/50">
          <span className="text-[11px] font-semibold text-violet-800 uppercase tracking-wide block mb-2">
            Popular VIT Mentoring Topics:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_TEACH_SUGGESTIONS.filter((s) => !teachingSkills.includes(s)).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTeachSkill(suggestion)}
                className="text-xs font-medium bg-white hover:bg-violet-100/80 text-violet-800 border border-violet-200 rounded-full px-2.5 py-1 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-violet-500" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Skills You Want to Learn */}
      <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <Label className="text-base font-bold text-indigo-950">
              Skills You Want to Learn (Goals)
            </Label>
            <p className="text-xs text-indigo-700">SkillSwap will recommend peer mentors and study groups matching these goals.</p>
          </div>
        </div>

        {/* Custom Input */}
        <div className="flex gap-2">
          <Input
            placeholder="Type a skill you want to learn..."
            value={newLearnSkill}
            onChange={(e) => setNewLearnSkill(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLearnSkill();
              }
            }}
            className="h-10 bg-white"
          />
          <Button
            type="button"
            onClick={() => addLearnSkill()}
            className="shrink-0 bg-indigo-600 hover:bg-indigo-700 h-10 px-4 text-xs font-medium cursor-pointer"
          >
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </div>

        {/* Active Learning Badges */}
        <div className="flex flex-wrap gap-2 pt-1 min-h-[36px]">
          {learningSkills.map((skill) => (
            <div
              key={skill}
              className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeLearnSkill(skill)}
                className="rounded-full p-0.5 hover:bg-indigo-700 cursor-pointer"
                aria-label={`Remove ${skill}`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {learningSkills.length === 0 && (
            <p className="text-xs text-indigo-400 italic">No learning goals selected yet.</p>
          )}
        </div>

        {/* Quick-add suggestions */}
        <div className="pt-2 border-t border-indigo-200/50">
          <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wide block mb-2">
            Popular Learning Goals:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_LEARN_SUGGESTIONS.filter((s) => !learningSkills.includes(s)).map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addLearnSkill(suggestion)}
                className="text-xs font-medium bg-white hover:bg-indigo-100/80 text-indigo-800 border border-indigo-200 rounded-full px-2.5 py-1 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3 text-indigo-500" />
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex justify-between border-t border-gray-100 pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-11 cursor-pointer rounded-xl px-6 text-sm font-medium"
        >
          ← Back
        </Button>

        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="h-11 cursor-pointer rounded-xl bg-violet-600 px-8 hover:bg-violet-700 text-sm font-medium shadow-xs"
        >
          {isSubmitting ? "Saving..." : "Continue to Availability →"}
        </Button>
      </div>
    </div>
  );
}