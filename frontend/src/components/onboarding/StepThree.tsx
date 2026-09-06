import { useState } from "react";
import { Clock, Calendar, Sparkles, CheckCircle2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DayAvailability, DayOfWeek } from "@/data/mentors";
import { createDefaultAvailability } from "@/data/mentors";
import { formatTime24to12, parseTimeToMinutes } from "@/utils/sessionTime";

interface StepThreeProps {
  initialSchedule?: DayAvailability[];
  onBack: () => void;
  onFinish: (schedule: DayAvailability[]) => Promise<void>;
}

const daysOrder: { key: DayOfWeek; label: string }[] = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const timeOptions = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30", "22:00",
];

export default function StepThree({
  initialSchedule,
  onBack,
  onFinish,
}: StepThreeProps) {
  const [schedule, setSchedule] = useState<DayAvailability[]>(() => {
    return initialSchedule && initialSchedule.length > 0
      ? initialSchedule
      : createDefaultAvailability();
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: "weekdays" | "weekends" | "flexible") => {
    if (preset === "weekdays") {
      setSchedule(
        daysOrder.map(({ key }) => ({
          day: key,
          enabled: ["monday", "tuesday", "wednesday", "thursday", "friday"].includes(key),
          startTime: "17:00",
          endTime: "20:00",
        }))
      );
    } else if (preset === "weekends") {
      setSchedule(
        daysOrder.map(({ key }) => ({
          day: key,
          enabled: ["saturday", "sunday"].includes(key),
          startTime: "10:00",
          endTime: "14:00",
        }))
      );
    } else if (preset === "flexible") {
      setSchedule(
        daysOrder.map(({ key }) => ({
          day: key,
          enabled: ["monday", "wednesday", "friday", "saturday"].includes(key),
          startTime: "16:00",
          endTime: "19:00",
        }))
      );
    }
  };

  const handleToggleDay = (dayKey: DayOfWeek) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.day === dayKey ? { ...item, enabled: !item.enabled } : item
      )
    );
    setError(null);
  };

  const handleTimeChange = (
    dayKey: DayOfWeek,
    field: "startTime" | "endTime",
    value: string
  ) => {
    setSchedule((prev) =>
      prev.map((item) =>
        item.day === dayKey ? { ...item, [field]: value } : item
      )
    );
    setError(null);
  };

  const handleFinish = async () => {
    setError(null);

    // Validate times for enabled days
    for (const item of schedule) {
      if (item.enabled) {
        const startMins = parseTimeToMinutes(item.startTime);
        const endMins = parseTimeToMinutes(item.endTime);

        if (startMins === null || endMins === null || startMins >= endMins) {
          const dayName = item.day.charAt(0).toUpperCase() + item.day.slice(1);
          setError(
            `Invalid time window for ${dayName}: Start time (${formatTime24to12(
              item.startTime
            )}) must be before end time (${formatTime24to12(item.endTime)}).`
          );
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      await onFinish(schedule);
    } catch (err: any) {
      setError(err.message || "Failed to complete setup.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const enabledCount = schedule.filter((s) => s.enabled).length;

  return (
    <div className="rounded-3xl border border-violet-100 bg-white p-6 sm:p-10 shadow-sm max-w-3xl mx-auto">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Step 3 of 3: Teaching Availability</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Set Your Weekly Schedule
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Choose which days and hours you are available to teach peer sessions. You can edit this anytime in Settings.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Quick Presets */}
      <div className="mb-6 rounded-2xl bg-gradient-to-r from-violet-50 to-indigo-50/70 p-4 border border-violet-100">
        <span className="text-xs font-bold text-violet-900 flex items-center gap-1 mb-2">
          <Zap className="w-3.5 h-3.5 text-violet-600" /> Quick Schedule Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => applyPreset("weekdays")}
            className="text-xs font-semibold bg-white hover:bg-violet-600 hover:text-white text-violet-700 border border-violet-200 rounded-lg px-3 py-1.5 transition-all cursor-pointer shadow-2xs"
          >
            🌙 Weekday Evenings (5:00 PM – 8:00 PM)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("weekends")}
            className="text-xs font-semibold bg-white hover:bg-violet-600 hover:text-white text-violet-700 border border-violet-200 rounded-lg px-3 py-1.5 transition-all cursor-pointer shadow-2xs"
          >
            ☀️ Weekends (10:00 AM – 2:00 PM)
          </button>
          <button
            type="button"
            onClick={() => applyPreset("flexible")}
            className="text-xs font-semibold bg-white hover:bg-violet-600 hover:text-white text-violet-700 border border-violet-200 rounded-lg px-3 py-1.5 transition-all cursor-pointer shadow-2xs"
          >
            ⚡ Flexible (Mon, Wed, Fri, Sat)
          </button>
        </div>
      </div>

      {/* Schedule Summary Bar */}
      <div className="mb-4 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 border border-slate-200/80">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
          <Calendar size={16} className="text-violet-600" />
          <span>
            {enabledCount > 0
              ? `Active on ${enabledCount} ${enabledCount === 1 ? "day" : "days"} per week`
              : "No teaching days selected"}
          </span>
        </div>
        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Bookable by VIT peers
        </span>
      </div>

      {/* Weekly Schedule Day List */}
      <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
        {daysOrder.map(({ key, label }) => {
          const dayConfig = schedule.find((s) => s.day === key) || {
            day: key,
            enabled: false,
            startTime: "17:00",
            endTime: "20:00",
          };

          const startMins = parseTimeToMinutes(dayConfig.startTime) ?? 0;
          const endMins = parseTimeToMinutes(dayConfig.endTime) ?? 0;
          const durationHrs = Math.max(0, (endMins - startMins) / 60);

          return (
            <div
              key={key}
              className={`p-3.5 sm:p-4 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                dayConfig.enabled ? "bg-white" : "bg-slate-50/60 text-slate-400"
              }`}
            >
              {/* Day Toggle */}
              <div className="flex items-center gap-3 min-w-[130px]">
                <input
                  type="checkbox"
                  id={`onboarding-day-${key}`}
                  checked={dayConfig.enabled}
                  onChange={() => handleToggleDay(key)}
                  className="h-4 w-4 cursor-pointer accent-violet-600 rounded"
                />
                <label
                  htmlFor={`onboarding-day-${key}`}
                  className={`cursor-pointer text-sm font-semibold select-none ${
                    dayConfig.enabled ? "text-slate-900" : "text-slate-500"
                  }`}
                >
                  {label}
                </label>
              </div>

              {/* Time Range */}
              {dayConfig.enabled ? (
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} className="text-violet-500 shrink-0" />
                    <select
                      value={dayConfig.startTime}
                      onChange={(e) =>
                        handleTimeChange(key, "startTime", e.target.value)
                      }
                      className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                    >
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>
                          {formatTime24to12(t)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <span className="text-slate-400 text-xs font-medium">to</span>

                  <select
                    value={dayConfig.endTime}
                    onChange={(e) =>
                      handleTimeChange(key, "endTime", e.target.value)
                    }
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                  >
                    {timeOptions.map((t) => (
                      <option key={t} value={t}>
                        {formatTime24to12(t)}
                      </option>
                    ))}
                  </select>

                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-700 whitespace-nowrap">
                    {durationHrs > 0 ? `${durationHrs} hrs` : "0 hrs"}
                  </span>
                </div>
              ) : (
                <span className="text-xs font-medium text-slate-400 italic">
                  Not available
                </span>
              )}
            </div>
          );
        })}
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
          onClick={handleFinish}
          disabled={isSubmitting}
          className="h-11 cursor-pointer rounded-xl bg-violet-600 px-8 hover:bg-violet-700 text-sm font-medium shadow-sm text-white"
        >
          {isSubmitting ? "Finishing..." : "Complete Setup & Launch Dashboard 🎉"}
        </Button>
      </div>
    </div>
  );
}