import type { Session } from "@/data/sessions";
import type { User } from "@/data/mentors";

/**
 * Extracts the start time component from a time string such as "5:00 PM – 6:00 PM" or "11:00 AM".
 */
export const formatStartTimeOnly = (timeStr: string): string => {
  if (!timeStr) return "";
  const startPart = timeStr.split(/–|-/)[0].trim();
  return startPart;
};

/**
 * Parses date string (e.g. "August 22, 2026", "2026-08-22", "Jul 28, 2026")
 * and time string (e.g. "5:00 PM – 6:00 PM" or "11:00 AM")
 * into a Date object representing the scheduled start datetime.
 */
export const getSessionStartDateTime = (
  dateStr: string | undefined,
  timeStr: string | undefined
): Date | null => {
  if (!dateStr || !timeStr) return null;

  let year: number;
  let month: number; // 0-indexed
  let day: number;

  const trimmedDate = dateStr.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    const parts = trimmedDate.split("-").map(Number);
    year = parts[0];
    month = parts[1] - 1;
    day = parts[2];
  } else {
    const parsedDate = new Date(trimmedDate);
    if (isNaN(parsedDate.getTime())) return null;
    year = parsedDate.getFullYear();
    month = parsedDate.getMonth();
    day = parsedDate.getDate();
  }

  // Extract start time part (e.g., "5:00 PM" from "5:00 PM – 6:00 PM")
  const startTimePart = timeStr.split(/–|-/)[0].trim();
  const timeMatch = startTimePart.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!timeMatch) return null;

  let hours = parseInt(timeMatch[1], 10);
  const minutes = parseInt(timeMatch[2], 10);
  const meridian = timeMatch[3]?.toUpperCase();

  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  const dt = new Date(year, month, day, hours, minutes, 0, 0);
  if (isNaN(dt.getTime())) return null;
  return dt;
};

/**
 * Parses the scheduled end datetime using either the end time in the time string
 * or the duration string (e.g. "60 minutes").
 */
export const getSessionEndDateTime = (
  dateStr: string | undefined,
  timeStr: string | undefined,
  durationStr?: string
): Date | null => {
  const startDate = getSessionStartDateTime(dateStr, timeStr);
  if (!startDate) return null;

  if (timeStr) {
    const parts = timeStr.split(/–|-/);
    if (parts.length > 1 && parts[1].trim()) {
      const endTimePart = parts[1].trim();
      const timeMatch = endTimePart.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const meridian = timeMatch[3]?.toUpperCase();

        if (meridian === "PM" && hours < 12) hours += 12;
        if (meridian === "AM" && hours === 12) hours = 0;

        const endDate = new Date(startDate);
        endDate.setHours(hours, minutes, 0, 0);
        if (endDate < startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }
        return endDate;
      }
    }
  }

  const durationMatch = durationStr?.match(/\d+/);
  const durationMinutes = durationMatch ? parseInt(durationMatch[0], 10) : 60;
  return new Date(startDate.getTime() + durationMinutes * 60 * 1000);
};

/**
 * Returns true if the session's scheduled start datetime is strictly in the future.
 */
export const isSessionBeforeStart = (
  dateStr: string | undefined,
  timeStr: string | undefined,
  now = new Date()
): boolean => {
  const start = getSessionStartDateTime(dateStr, timeStr);
  if (!start) return false;
  return now.getTime() < start.getTime();
};

/**
 * Returns true if the session's scheduled start datetime has arrived or passed.
 */
export const isSessionStartedTime = (
  dateStr: string | undefined,
  timeStr: string | undefined,
  now = new Date()
): boolean => {
  const start = getSessionStartDateTime(dateStr, timeStr);
  if (!start) return true;
  return now.getTime() >= start.getTime();
};

export type SessionAccessCheck = {
  allowed: boolean;
  status: "ALLOWED" | "NOT_PARTICIPANT" | "BEFORE_START" | "COMPLETED" | "NOT_UPCOMING";
  title?: string;
  message?: string;
};

/**
 * Evaluates whether the given user is allowed to access the session room.
 */
export const checkSessionAccess = (
  session: Session | undefined,
  currentUser: User | undefined,
  now = new Date()
): SessionAccessCheck => {
  if (!session) {
    return {
      allowed: false,
      status: "NOT_UPCOMING",
      title: "Session not found",
      message: "The session you are looking for does not exist or may have been removed.",
    };
  }

  if (!currentUser) {
    return {
      allowed: false,
      status: "NOT_PARTICIPANT",
      title: "Authentication required",
      message: "Please select an active user profile to view this session.",
    };
  }

  // 1. Participant check: user must be learner or mentor
  const isParticipant =
    session.learnerId === currentUser.id || session.mentorId === currentUser.id;

  if (!isParticipant) {
    return {
      allowed: false,
      status: "NOT_PARTICIPANT",
      title: "Access Denied",
      message: "You are not a participant in this session.",
    };
  }

  // 2. Completed check
  if (session.status === "completed") {
    return {
      allowed: false,
      status: "COMPLETED",
      title: "Session completed",
      message: "This session has ended and is marked as completed.",
    };
  }

  // 3. Pending / Cancelled / Rejected check
  if (session.status === "pending") {
    return {
      allowed: false,
      status: "NOT_UPCOMING",
      title: "Session request pending",
      message: "This session request is still waiting for mentor acceptance.",
    };
  }

  if (session.status === "cancelled" || session.status === "rejected") {
    return {
      allowed: false,
      status: "NOT_UPCOMING",
      title: `Session ${session.status}`,
      message: `This session is ${session.status} and cannot be joined.`,
    };
  }

  // 3b. Expired check: unstarted upcoming session whose end time has passed
  if (isSessionExpired(session, now)) {
    return {
      allowed: false,
      status: "NOT_UPCOMING",
      title: "Session Expired",
      message: "This session's scheduled time window has passed without being started.",
    };
  }

  // 4. In-progress or upcoming (waiting room for learner / start lobby for mentor)
  return {
    allowed: true,
    status: "ALLOWED",
  };
};

/**
 * Returns true if an unstarted upcoming session's scheduled end time has completely passed.
 */
export const isSessionExpired = (
  session: Session | undefined,
  now = new Date()
): boolean => {
  if (!session || session.status !== "upcoming" || session.isStarted) return false;
  const end = getSessionEndDateTime(session.date, session.time, session.duration);
  if (!end) return false;
  return now.getTime() > end.getTime();
};

/**
 * Returns true if a pending initial session request's scheduled start datetime has passed.
 */
export const isInitialRequestExpired = (
  session: Session | undefined,
  now = new Date()
): boolean => {
  if (!session || session.status !== "pending") return false;
  const start = getSessionStartDateTime(session.date, session.time);
  if (!start) return false;
  return now.getTime() >= start.getTime();
};

/**
 * Returns true if a pending reschedule request's proposed start datetime has passed.
 */
export const isRescheduleRequestExpired = (
  req: import("@/data/sessions").RescheduleRequest | undefined,
  now = new Date()
): boolean => {
  if (!req || req.status !== "pending") return false;
  const start = getSessionStartDateTime(req.proposedDate, req.proposedTime);
  if (!start) return false;
  return now.getTime() >= start.getTime();
};

/**
 * Converts a date string ("YYYY-MM-DD" or "Month DD, YYYY") into a DayOfWeek ("monday" ... "sunday").
 */
export const getDayOfWeekFromDate = (dateStr: string | undefined): import("@/data/mentors").DayOfWeek | null => {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();

  let dateObj: Date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, d] = trimmed.split("-").map(Number);
    dateObj = new Date(y, m - 1, d);
  } else {
    dateObj = new Date(trimmed);
  }

  if (isNaN(dateObj.getTime())) return null;

  const dayIndex = dateObj.getDay(); // 0 = Sunday, 1 = Monday, ...
  const days: import("@/data/mentors").DayOfWeek[] = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  return days[dayIndex];
};

/**
 * Converts "17:00" to "5:00 PM", "09:30" to "9:30 AM".
 */
export const formatTime24to12 = (time24: string): string => {
  if (!time24) return "";
  const parts = time24.split(":");
  if (parts.length < 2) return time24;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return time24;

  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const minsPadded = minutes.toString().padStart(2, "0");
  return `${hour12}:${minsPadded} ${period}`;
};

/**
 * Converts "5:00 PM" (or "17:00") to minutes from midnight (0..1439).
 */
export const parseTimeToMinutes = (timeStr: string | undefined): number | null => {
  if (!timeStr) return null;
  const startPart = formatStartTimeOnly(timeStr);

  // 1. Try 24h "HH:MM"
  if (/^\d{1,2}:\d{2}$/.test(startPart)) {
    const [h, m] = startPart.split(":").map(Number);
    return h * 60 + m;
  }

  // 2. Try 12h "H:MM AM/PM"
  const match = startPart.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3]?.toUpperCase();

  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

/**
 * Checks if a session start time + duration fits completely inside the mentor's day availability.
 */
export const isTimeWithinAvailability = (
  timeStr: string | undefined,
  durationStr: string | undefined,
  avail: import("@/data/mentors").DayAvailability | undefined
): { valid: boolean; error?: string } => {
  if (!avail || !avail.enabled) {
    return { valid: false, error: "Mentor is not available on this day." };
  }

  const startMinutes = parseTimeToMinutes(timeStr);
  if (startMinutes === null) {
    return { valid: false, error: "Invalid session time selected." };
  }

  const durationMatch = durationStr?.match(/\d+/);
  const durationMinutes = durationMatch ? parseInt(durationMatch[0], 10) : 60;
  const endMinutes = startMinutes + durationMinutes;

  const availStartMinutes = parseTimeToMinutes(avail.startTime) ?? 0;
  const availEndMinutes = parseTimeToMinutes(avail.endTime) ?? 1440;

  if (startMinutes < availStartMinutes) {
    return {
      valid: false,
      error: `Session cannot start before mentor's availability (${formatTime24to12(avail.startTime)}).`,
    };
  }

  if (endMinutes > availEndMinutes) {
    return {
      valid: false,
      error: `A ${durationMinutes}-minute session starting at ${formatTime24to12(
        `${Math.floor(startMinutes / 60)}:${(startMinutes % 60).toString().padStart(2, "0")}`
      )} extends beyond mentor's available window (${formatTime24to12(avail.startTime)} – ${formatTime24to12(avail.endTime)}).`,
    };
  }

  return { valid: true };
};

/**
 * Detects conflicts between the requested slot and existing active (pending/upcoming) sessions.
 */
export const checkSlotConflict = (
  dateStr: string | undefined,
  timeStr: string | undefined,
  durationStr: string | undefined,
  sessions: Session[],
  mentorId: string,
  ignoreSessionId?: string
): { hasConflict: boolean; conflictingSession?: Session; conflictReason?: string } => {
  const reqStart = getSessionStartDateTime(dateStr, timeStr);
  const reqEnd = getSessionEndDateTime(dateStr, timeStr, durationStr);

  if (!reqStart || !reqEnd) {
    return { hasConflict: false };
  }

  // Filter active sessions for the same mentor
  const activeSessions = sessions.filter(
    (s) =>
      s.mentorId === mentorId &&
      (s.status === "pending" || s.status === "upcoming") &&
      s.id !== ignoreSessionId
  );

  for (const existing of activeSessions) {
    const exStart = getSessionStartDateTime(existing.date, existing.time);
    const exEnd = getSessionEndDateTime(existing.date, existing.time, existing.duration);

    if (!exStart || !exEnd) continue;

    // Range overlap: reqStart < exEnd AND exStart < reqEnd
    if (reqStart.getTime() < exEnd.getTime() && exStart.getTime() < reqEnd.getTime()) {
      const statusLabel = existing.status === "pending" ? "pending request" : "booked session";
      return {
        hasConflict: true,
        conflictingSession: existing,
        conflictReason: `This slot conflicts with an existing ${statusLabel} (${existing.time}) for ${existing.topic}.`,
      };
    }
  }

  return { hasConflict: false };
};

/**
 * Comprehensive schedule validation pipeline for booking and rescheduling.
 */
export const validateSessionSchedule = (
  mentor: User | undefined,
  dateStr: string | undefined,
  timeStr: string | undefined,
  durationStr: string | undefined,
  sessions: Session[],
  ignoreSessionId?: string
): { valid: boolean; error?: string } => {
  if (!mentor) {
    return { valid: false, error: "Mentor not found." };
  }

  // 1. Check if mentor has any availability configured
  const hasAnyAvail = mentor.availability?.some((a) => a.enabled);
  if (!hasAnyAvail) {
    return { valid: false, error: "This mentor has no available teaching slots configured." };
  }

  // 2. Validate date is present
  if (!dateStr || !dateStr.trim()) {
    return { valid: false, error: "Please select a date." };
  }

  // 3. Validate day of the week
  const dayOfWeek = getDayOfWeekFromDate(dateStr);
  if (!dayOfWeek) {
    return { valid: false, error: "Invalid date format." };
  }

  const dayAvail = mentor.availability.find((a) => a.day === dayOfWeek);
  if (!dayAvail || !dayAvail.enabled) {
    const availableDayNames = mentor.availability
      .filter((a) => a.enabled)
      .map((a) => a.day.charAt(0).toUpperCase() + a.day.slice(1))
      .join(", ");
    return {
      valid: false,
      error: `Mentor is not available on ${dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1)}. Available days: ${availableDayNames || "None"}.`,
    };
  }

  // 4. Validate time
  if (!timeStr || !timeStr.trim()) {
    return { valid: false, error: "Please select a preferred time." };
  }

  // 5. Validate time fits inside mentor's availability window
  const windowCheck = isTimeWithinAvailability(timeStr, durationStr, dayAvail);
  if (!windowCheck.valid) {
    return windowCheck;
  }

  // 6. Validate conflict / double booking
  const conflictCheck = checkSlotConflict(
    dateStr,
    timeStr,
    durationStr,
    sessions,
    mentor.id,
    ignoreSessionId
  );
  if (conflictCheck.hasConflict) {
    return {
      valid: false,
      error: conflictCheck.conflictReason || "This slot conflicts with another active session.",
    };
  }

  return { valid: true };
};

export type SlotSuggestion = {
  time24: string;
  timeDisplay: string;
  available: boolean;
  conflictReason?: string;
};

/**
 * Returns available slot suggestions within the mentor's window for a given date.
 */
export const getAvailableSlotsForDate = (
  mentor: User | undefined,
  dateStr: string | undefined,
  durationStr: string | undefined,
  sessions: Session[],
  ignoreSessionId?: string
): SlotSuggestion[] => {
  if (!mentor || !dateStr) return [];

  const dayOfWeek = getDayOfWeekFromDate(dateStr);
  if (!dayOfWeek) return [];

  const dayAvail = mentor.availability?.find((a) => a.day === dayOfWeek && a.enabled);
  if (!dayAvail) return [];

  const startMinutes = parseTimeToMinutes(dayAvail.startTime);
  const endMinutes = parseTimeToMinutes(dayAvail.endTime);
  if (startMinutes === null || endMinutes === null) return [];

  const durationMatch = durationStr?.match(/\d+/);
  const durationMinutes = durationMatch ? parseInt(durationMatch[0], 10) : 60;

  const slots: SlotSuggestion[] = [];

  // Generate slots in 30-minute intervals
  for (let m = startMinutes; m + durationMinutes <= endMinutes; m += 30) {
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    const time24 = `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
    const timeDisplay = formatTime24to12(time24);

    const conflict = checkSlotConflict(
      dateStr,
      time24,
      durationStr,
      sessions,
      mentor.id,
      ignoreSessionId
    );

    slots.push({
      time24,
      timeDisplay,
      available: !conflict.hasConflict,
      conflictReason: conflict.conflictReason,
    });
  }

  return slots;
};

/**
 * Converts a time string (e.g. "5:30 PM", "17:30", "11:00 AM") into minutes from midnight.
 */
export const parseSingleTimeToMinutes = (timeStr: string | undefined): number | null => {
  if (!timeStr) return null;
  const clean = timeStr.trim();
  // 1. Try 24h "HH:MM"
  if (/^\d{1,2}:\d{2}$/.test(clean)) {
    const [h, m] = clean.split(":").map(Number);
    return h * 60 + m;
  }
  // 2. Try 12h "H:MM AM/PM"
  const match = clean.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridian = match[3]?.toUpperCase();
  if (meridian === "PM" && hours < 12) hours += 12;
  if (meridian === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
};

/**
 * Calculates and formats a clean session duration string (e.g. "30 Min", "60 Min").
 * Prioritizes actual booked minutes, time difference between start and end time, or duration string.
 */
export const formatSessionDuration = (
  session:
    | {
        duration?: string;
        durationMinutes?: number;
        duration_minutes?: number;
        time?: string;
        startTime?: string;
        endTime?: string;
      }
    | undefined
    | null
): string => {
  if (!session) return "30 Min";

  // 1. If explicit duration string already has a number
  if (session.duration) {
    const match = session.duration.match(/\d+/);
    if (match) {
      return `${match[0]} Min`;
    }
  }

  // 2. If durationMinutes is present
  const mins = session.durationMinutes ?? session.duration_minutes;
  if (typeof mins === "number" && mins > 0) {
    return `${mins} Min`;
  }

  // 3. If startTime & endTime are explicitly provided
  if (session.startTime && session.endTime) {
    const startM = parseSingleTimeToMinutes(session.startTime);
    const endM = parseSingleTimeToMinutes(session.endTime);
    if (startM !== null && endM !== null && endM > startM) {
      return `${endM - startM} Min`;
    }
  }

  // 4. Calculate from time range e.g. "5:00 PM – 5:30 PM" or "17:00 - 17:30"
  if (session.time && (session.time.includes("–") || session.time.includes("-"))) {
    const parts = session.time.split(/–|-/);
    if (parts.length >= 2) {
      const startM = parseSingleTimeToMinutes(parts[0]);
      const endM = parseSingleTimeToMinutes(parts[1]);
      if (startM !== null && endM !== null && endM > startM) {
        return `${endM - startM} Min`;
      }
    }
  }

  return "30 Min";
};
