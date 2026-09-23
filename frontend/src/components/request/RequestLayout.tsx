import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSessions } from "@/hooks/useSessions";
import { useWallet } from "@/hooks/useWallet";
import { useChat } from "@/hooks/useChat";
import { mentorApi } from "@/services/mentorApi";
import type { Session } from "@/data/sessions";
import { validateSessionSchedule } from "@/utils/sessionTime";

import Sidebar from "../dashboard/Sidebar";
import Topbar from "../dashboard/Topbar";

import SessionInfo from "./SessionInfo";
import TopicInput from "./TopicInput";
import GoalTextarea from "./GoalTextarea";
import ScheduleCard from "./ScheduleCard";
import CreditsCard from "./CreditsCard";
import SubmitRequest from "./SubmitRequest";

import type { Mentor } from "@/data/mentors";

type RequestLayoutProps = {
  mentor?: Mentor;
  sourceSession?: Session;
};

// Helper: parse date to YYYY-MM-DD
const parseDateToInputValue = (dateStr: string): string => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const dateObj = new Date(dateStr);
  if (!isNaN(dateObj.getTime())) {
    const year = dateObj.getFullYear();
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const day = dateObj.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return "";
};

// Helper: parse time to HH:MM
const parseTimeToInputValue = (timeStr: string): string => {
  if (!timeStr) return "";
  if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
  const startPart = timeStr.split("–")[0].split("-")[0].trim();
  const match = startPart.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2].padStart(2, "0");
    const period = match[3]?.toUpperCase();
    if (period === "PM" && hours < 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  }
  return "";
};

// Helper: format YYYY-MM-DD to "Month DD, YYYY"
const formatDateToDisplay = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    const [year, month, day] = parts.map(Number);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    if (month >= 1 && month <= 12) {
      const dayPadded = day.toString().padStart(2, "0");
      return `${months[month - 1]} ${dayPadded}, ${year}`;
    }
  }
  const dateObj = new Date(dateStr);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    });
  }
  return dateStr;
};

// Helper: format HH:MM and duration to display range (e.g. "5:00 PM – 6:00 PM")
const formatTimeRangeToDisplay = (timeStr: string, durationStr: string): string => {
  if (!timeStr) return "";
  if (timeStr.includes("–") || timeStr.includes("-")) return timeStr;
  const [hStr, mStr] = timeStr.split(":");
  const hours = parseInt(hStr, 10);
  const minutes = parseInt(mStr, 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;

  const startPeriod = hours >= 12 ? "PM" : "AM";
  const startHour12 = hours % 12 || 12;
  const startMins = minutes.toString().padStart(2, "0");
  const formattedStart = `${startHour12}:${startMins} ${startPeriod}`;

  const durationMatch = durationStr.match(/\d+/);
  const durationMinutes = durationMatch ? parseInt(durationMatch[0], 10) : 60;

  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours24 = Math.floor(totalMinutes / 60) % 24;
  const endMins = (totalMinutes % 60).toString().padStart(2, "0");
  const endPeriod = endHours24 >= 12 ? "PM" : "AM";
  const endHour12 = endHours24 % 12 || 12;
  const formattedEnd = `${endHour12}:${endMins} ${endPeriod}`;

  return `${formattedStart} – ${formattedEnd}`;
};

// Helper: generate unique session ID (UUID)
const generateUniqueSessionId = (_existingSessions: Session[]): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const RequestLayout = ({
  mentor,
  sourceSession,
}: RequestLayoutProps) => {
  const navigate = useNavigate();
  const { sessions, addSession, currentUser, getUserById } = useSessions();
  const { canAffordBooking } = useWallet();
  const { getOrCreateConversation, sendMessage } = useChat();

  const effectiveMentorId = mentor?.id || sourceSession?.mentorId || "";
  const [liveMentor, setLiveMentor] = useState<Mentor | undefined>(() => getUserById(effectiveMentorId) || mentor);

  useEffect(() => {
    if (effectiveMentorId) {
      mentorApi
        .getMentorById(effectiveMentorId)
        .then((fresh) => {
          if (fresh) {
            setLiveMentor(fresh);
          }
        })
        .catch(() => {});
    }
  }, [effectiveMentorId]);

  const effectiveMentor = liveMentor || getUserById(effectiveMentorId) || mentor;

  const effectiveMentorName = effectiveMentor?.name || mentor?.name || sourceSession?.mentor || "Mentor";
  const effectiveMentorRole = effectiveMentor?.role || mentor?.role || sourceSession?.mentorRole || "Student Mentor";
  const effectiveMentorRating = effectiveMentor?.rating ?? mentor?.rating ?? sourceSession?.mentorRating ?? 0;
  const effectiveReviewCount = effectiveMentor?.reviewCount ?? mentor?.reviewCount ?? sourceSession?.reviewCount ?? 0;
  const effectiveMentorAvatar = effectiveMentor?.avatar || mentor?.avatar || sourceSession?.mentorAvatar;
  const effectiveTeachingSkill = effectiveMentor?.teachingSkill || mentor?.teachingSkill || sourceSession?.teachingSkill || "";

  // Initial values pre-filled from mentor or cancelled session if available
  const [topic, setTopic] = useState(
    sourceSession?.topic || effectiveMentor?.teachingSkill || (effectiveMentor?.teaches && effectiveMentor.teaches[0]) || ""
  );
  const [goal, setGoal] = useState(sourceSession?.learnerGoal || "");
  const [date, setDate] = useState(parseDateToInputValue(sourceSession?.date || ""));
  const [time, setTime] = useState(parseTimeToInputValue(sourceSession?.time || ""));
  const [duration, setDuration] = useState(
    sourceSession?.duration?.includes("30")
      ? "30 Min"
      : sourceSession?.duration?.includes("90")
      ? "90 Min"
      : "60 Min"
  );
  const [agreed, setAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [topicError, setTopicError] = useState<string | undefined>();
  const [goalError, setGoalError] = useState<string | undefined>();
  const [dateError, setDateError] = useState<string | undefined>();
  const [timeError, setTimeError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | undefined>();

  const todayStr = new Date().toISOString().split("T")[0];

  const handleSubmit = async () => {
    let hasError = false;
    setTopicError(undefined);
    setGoalError(undefined);
    setDateError(undefined);
    setTimeError(undefined);
    setSubmitError(undefined);

    // 0. Prevent self-booking
    if (currentUser.id === effectiveMentorId) {
      setSubmitError("You cannot book a session with yourself.");
      hasError = true;
    }

    // 1. Credits check
    if (!canAffordBooking(5)) {
      setSubmitError("Insufficient credits. At least 5 credits are required to book this session.");
      hasError = true;
    }

    // 2. Topic validation
    if (!topic.trim()) {
      setTopicError("Please enter a session topic.");
      hasError = true;
    }

    // 3. Goal validation
    if (!goal.trim()) {
      setGoalError("Please describe your learning goals.");
      hasError = true;
    }

    // 4. Date validation
    if (!date.trim()) {
      setDateError("Please select a preferred date.");
      hasError = true;
    } else if (date < todayStr) {
      setDateError("The selected date cannot be in the past.");
      hasError = true;
    }

    // 5. Time validation
    if (!time.trim()) {
      setTimeError("Please select a preferred time.");
      hasError = true;
    }

    // 6. Mentor Availability & Schedule Conflict Validation
    if (date.trim() && time.trim()) {
      const scheduleValidation = validateSessionSchedule(
        effectiveMentor,
        date,
        time,
        duration,
        sessions
      );

      if (!scheduleValidation.valid) {
        setSubmitError(scheduleValidation.error);
        hasError = true;
      }
    }

    // 7. Community guidelines agreement
    if (!agreed) {
      setSubmitError("Please agree to the community guidelines before sending the request.");
      hasError = true;
    }

    if (hasError) return;

    setIsSubmitting(true);

    // Create new session request with unique ID
    const newId = generateUniqueSessionId(sessions);
    const durationNum = duration.match(/\d+/)?.[0] || "60";
    const formattedDuration = `${durationNum} minutes`;

    const newSession: Session = {
      id: newId,
      learnerId: currentUser.id,
      mentorId: effectiveMentorId,
      mentor: effectiveMentorName,
      mentorRole: effectiveMentorRole,
      mentorRating: effectiveMentorRating,
      reviewCount: effectiveReviewCount,
      mentorAvatar: effectiveMentorAvatar,
      teachingSkill: effectiveTeachingSkill,
      learnerName: currentUser.name,
      topic: topic.trim(),
      sessionDescription:
        sourceSession?.sessionDescription ||
        `Learn and practice ${topic.trim()} in an interactive 1-on-1 mentorship session with ${effectiveMentorName}.`,
      learnerGoal: goal.trim(),
      date: formatDateToDisplay(date),
      time: formatTimeRangeToDisplay(time, duration),
      duration: formattedDuration,
      credits: sourceSession?.credits || 5,
      status: "pending",
      role: "learner",
    };

    const finalSessionId = await addSession(newSession);

    // Also send session request card into messages so mentor & learner can chat & negotiate timing
    try {
      if (effectiveMentorId && effectiveMentorId !== currentUser.id) {
        const conv = getOrCreateConversation(effectiveMentorId);
        if (conv?.id) {
          const sessionPayload = {
            type: "SESSION_REQUEST",
            sessionId: finalSessionId,
            topic: topic.trim(),
            date: formatDateToDisplay(date),
            rawDate: date.trim(),
            time: formatTimeRangeToDisplay(time, duration),
            rawTime: time.trim(),
            duration: formattedDuration,
            status: "pending",
            learnerGoal: goal.trim(),
            learnerName: currentUser.name,
            mentorName: effectiveMentorName,
          };
          sendMessage(conv.id, `[SESSION_REQUEST]:${JSON.stringify(sessionPayload)}`);
        }
      }
    } catch (chatErr) {
      console.warn("Could not post session request to chat:", chatErr);
    }

    navigate("/request-success", {
      state: { session: { ...newSession, id: finalSessionId } },
    });
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-violet-50 via-white to-violet-100">
      <Sidebar />

      <main className="flex-1 overflow-y-auto p-8">
        <Topbar />

        <div className="mt-8 grid gap-8 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <SessionInfo
              mentorName={effectiveMentorName}
            />

            <TopicInput
              value={topic}
              onChange={(val) => {
                setTopic(val);
                if (topicError) setTopicError(undefined);
              }}
              error={topicError}
            />

            <GoalTextarea
              value={goal}
              onChange={(val) => {
                setGoal(val);
                if (goalError) setGoalError(undefined);
              }}
              error={goalError}
            />

            <ScheduleCard
              mentor={effectiveMentor}
              sessions={sessions}
              date={date}
              time={time}
              duration={duration}
              onDateChange={(val) => {
                setDate(val);
                if (dateError) setDateError(undefined);
              }}
              onTimeChange={(val) => {
                setTime(val);
                if (timeError) setTimeError(undefined);
              }}
              onDurationChange={(val) => setDuration(val)}
              dateError={dateError}
              timeError={timeError}
            />
          </div>

          <div>
            <CreditsCard cost={5} />

            <div className="mt-6">
              <SubmitRequest
                agreed={agreed}
                onAgreedChange={(val) => {
                  setAgreed(val);
                  if (submitError) setSubmitError(undefined);
                }}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={submitError}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestLayout;