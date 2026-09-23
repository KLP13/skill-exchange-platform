export type SessionFilter =
  | "all"
  | "upcoming"
  | "pending"
  | "completed"
  | "cancelled"
  | "rejected";

export interface Session {
  id: string;
  learnerId: string;
  mentorId: string;
  mentor: string;
  mentorRole: string;
  mentorRating: number;
  reviewCount: number;
  mentorAvatar?: string;
  teachingSkill: string;
  topic: string;
  sessionDescription: string;
  learnerGoal: string;
  date: string;
  time: string;
  duration: string;
  durationMinutes?: number;
  credits: number;
  status: "upcoming" | "in_progress" | "pending" | "completed" | "cancelled" | "rejected";
  role?: "mentor" | "learner";
  learnerName?: string;
  isStarted?: boolean;
  startedAt?: string;
}

export interface RescheduleRequest {
  id: string;
  sessionId: string;
  requestedById: string;
  requestedForId: string;
  mentorId: string;
  learnerId: string;
  topic: string;
  currentDate: string;
  currentTime: string;
  proposedDate: string;
  proposedTime: string;
  duration: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "expired";
  createdAt: string;
  respondedAt?: string;
  reason?: string;
}

export interface SessionPdfNote {
  id: string;
  sessionId: string;
  mentorId: string;
  learnerId: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt: string;
}

export const sessions: Session[] = [];

