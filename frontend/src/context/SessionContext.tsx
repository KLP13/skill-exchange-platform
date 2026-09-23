import { createContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { Session, RescheduleRequest, SessionPdfNote } from "@/data/sessions";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/context/AuthContext";

import { useNotifications } from "@/hooks/useNotifications";
import { createDefaultAvailability } from "@/data/mentors";
import type { User } from "@/data/mentors";
import { mentorApi } from "@/services/mentorApi";
import { sessionApi } from "@/services/sessionApi";
import { reviewApi } from "@/services/reviewApi";
import { noteApi } from "@/services/noteApi";

import {
  isSessionBeforeStart,
  isInitialRequestExpired,
  isRescheduleRequestExpired,
  validateSessionSchedule,
  getSessionStartDateTime,
  formatSessionDuration,
} from "@/utils/sessionTime";

export interface SessionReview {
  sessionId: string;
  reviewerId: string;
  revieweeId: string;
  mentor: string;
  topic: string;
  rating: number;
  reviewText: string;
  comment?: string;
  submittedAt: string;
}

export interface SessionContextType {
  sessions: Session[];
  reviews: SessionReview[];
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchUserById: (id: string) => void;
  getUserById: (id: string | undefined) => User | undefined;
  updateUserProfile: (userId: string, updates: Partial<User>) => void;
  updateUserAvailability: (
    userId: string,
    availability: import("@/data/mentors").DayAvailability[]
  ) => void;
  addTeachingSkill: (userId: string, skill: string) => boolean;
  removeTeachingSkill: (userId: string, skill: string) => boolean;
  addLearningSkill: (userId: string, skill: string) => boolean;
  removeLearningSkill: (userId: string, skill: string) => boolean;
  getUserReviews: (userId: string | undefined) => SessionReview[];
  getUserRating: (userId: string | undefined) => { rating: number; reviewCount: number };
  incomingRequests: Session[];
  outgoingRequests: Session[];
  currentUserRole: "mentor" | "learner";
  setCurrentUserRole: (role: "mentor" | "learner") => void;
  getSessionById: (id: string | undefined) => Session | undefined;
  getReviewBySessionId: (
    sessionId: string | undefined
  ) => SessionReview | undefined;
  rescheduleRequests: import("@/data/sessions").RescheduleRequest[];
  createRescheduleRequest: (params: {
    sessionId: string;
    proposedDate: string;
    proposedTime: string;
    reason?: string;
  }) => { success: boolean; error?: string };
  acceptRescheduleRequest: (requestId: string) => { success: boolean; error?: string };
  rejectRescheduleRequest: (requestId: string) => { success: boolean; error?: string };
  cancelRescheduleRequest: (requestId: string) => { success: boolean; error?: string };
  getPendingRescheduleForSession: (
    sessionId: string | undefined
  ) => import("@/data/sessions").RescheduleRequest | undefined;
  rescheduleSession: (id: string, newDate: string, newTime: string) => boolean;
  cancelSession: (id: string) => boolean;
  cancelRequest: (id: string) => boolean;
  acceptRequest: (id: string) => boolean;
  rejectRequest: (id: string) => boolean;
  startSession: (id: string) => { success: boolean; error?: string };
  endSession: (id: string) => { success: boolean; error?: string };
  completeSession: (
    id: string,
    roleOverride?: "mentor" | "learner"
  ) => { success: boolean; error?: string };
  submitReview: (review: Omit<SessionReview, "submittedAt" | "reviewerId" | "revieweeId"> & { reviewerId?: string; revieweeId?: string }) => boolean;
  addSession: (session: Session) => Promise<string>;
  updateSessionTiming: (
    sessionId: string,
    scheduledDate: string,
    startTime: string,
    endTime: string,
    status?: Session["status"]
  ) => Promise<void>;
  sessionPdfNotes: SessionPdfNote[];
  uploadSessionNote: (params: {
    sessionId: string;
    file: File | { fileName: string; fileUrl: string; fileSize?: number };
  }) => { success: boolean; error?: string };
  getSessionPdfNote: (
    sessionId: string | undefined
  ) => SessionPdfNote | undefined;
  refreshSessions: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType | undefined>(
  undefined
);

const createDefaultUser = (): User => ({
  id: "",
  name: "Student",
  role: "student",
  department: "General",
  year: "1st Year",
  rating: 0,
  reviewCount: 0,
  credits: 40,
  sessionsCount: 0,
  avatar: "ST",
  teachingSkill: "",
  teaches: [],
  learns: [],
  bio: "",
  experienceYears: "",
  projectsBuilt: "",
  languages: "English",
  availability: createDefaultAvailability(),
});

export const SessionProvider = ({ children }: { children: ReactNode }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [rescheduleRequests, setRescheduleRequests] = useState<RescheduleRequest[]>([]);
  const [sessionPdfNotes, setSessionPdfNotes] = useState<SessionPdfNote[]>([]);
  const [reviews, setReviews] = useState<SessionReview[]>([]);
  const [usersState, setUsersState] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(createDefaultUser());
  const [currentUserRole, setCurrentUserRole] = useState<"mentor" | "learner">("mentor");
  const { user: authUser } = useAuth();
  const { completeSessionAndProcessCredits } = useWallet();
  const { addNotification } = useNotifications();

  // Synchronize real authenticated user when logged in
  useEffect(() => {
    if (authUser) {
      setUsersState((prev) => {
        const existing = prev.find((u) => u.id === authUser.id || u.email === authUser.email);
        if (existing) {
          const updated = {
            ...existing,
            name: authUser.fullName || existing.name,
            email: authUser.email,
            credits: authUser.credits ?? existing.credits,
            avatar: authUser.avatar || existing.avatar,
          };
          setCurrentUser(updated);
          return prev.map((u) => (u.id === existing.id ? updated : u));
        } else {
          const newUser: User = {
            id: authUser.id,
            name: authUser.fullName,
            email: authUser.email,
            role: authUser.role || "student",
            department: authUser.department || "Computer Science",
            year: "3rd Year",
            rating: 0,
            reviewCount: 0,
            credits: authUser.credits ?? 40,
            sessionsCount: 0,
            avatar:
              authUser.avatar ||
              authUser.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2),
            teachingSkill: "Web Development",
            teaches: ["React", "JavaScript"],
            learns: ["Machine Learning"],
            bio: "VIT Student passionate about peer learning on SkillSwap.",
            experienceYears: "1 Year",
            projectsBuilt: "3+",
            languages: "English",
            availability: createDefaultAvailability(),
          };
          setCurrentUser(newUser);
          return [newUser, ...prev];
        }
      });
    }
  }, [authUser]);

  // Load & periodically synchronize mentors directly from PostgreSQL
  useEffect(() => {
    const syncMentors = () => {
      mentorApi
        .getMentors()
        .then((liveMentors) => {
          if (liveMentors) {
            setUsersState((prev) => {
              const map = new Map<string, User>();
              // Live mentors from PostgreSQL with their real UUIDs
              liveMentors.forEach((m) => {
                map.set(m.id, m);
                if (m.email) map.set(m.email, m);
              });
              // Keep authenticated user if not in liveMentors
              prev.forEach((u) => {
                if (u.id && !map.has(u.id)) {
                  map.set(u.id, u);
                }
              });
              return Array.from(new Set(Array.from(map.values())));
            });
          }
        })
        .catch((err) => {
          console.warn("Could not load mentors from database:", err);
        });
    };

    syncMentors();
    const mentorInterval = setInterval(syncMentors, 3500);
    window.addEventListener("focus", syncMentors);

    return () => {
      clearInterval(mentorInterval);
      window.removeEventListener("focus", syncMentors);
    };
  }, []);

  // Synchronize live user sessions, reviews, and notes from PostgreSQL periodically
  const refreshSessions = useCallback(async (): Promise<void> => {
    if (!authUser?.id) return;
    try {
      const [liveSessions, liveReviews] = await Promise.all([
        sessionApi.getMySessions().catch((err) => {
          console.warn("Using local sessions fallback:", err);
          return null;
        }),
        reviewApi.getMyReviews().catch((err) => {
          console.warn("Using local reviews fallback:", err);
          return null;
        }),
      ]);

      // Sync reviews
      if (liveReviews) {
        setReviews((prev) => {
          const map = new Map<string, SessionReview>();
          // 1. Cached in local storage
          try {
            const cached = JSON.parse(localStorage.getItem("skillswap_saved_reviews") || "[]");
            if (Array.isArray(cached)) {
              cached.forEach((r: SessionReview) => map.set(r.sessionId, r));
            }
          } catch {}
          // 2. Previous React state
          prev.forEach((r) => map.set(r.sessionId, r));
          // 3. Fresh from backend PostgreSQL
          liveReviews.forEach((r: any) => {
            map.set(r.sessionId, {
              sessionId: r.sessionId,
              reviewerId: r.reviewerId,
              revieweeId: r.revieweeId,
              mentor: r.mentor || "Mentor",
              topic: r.topic || "Mentoring Session",
              rating: Number(r.rating) || 5,
              reviewText: r.reviewText || r.comment || "",
              comment: r.comment || r.reviewText || "",
              submittedAt: r.submittedAt || new Date().toISOString(),
            });
          });
          const merged = Array.from(map.values());
          try {
            localStorage.setItem("skillswap_saved_reviews", JSON.stringify(merged));
          } catch {}
          return merged;
        });
      }

      // Sync sessions
      if (liveSessions) {
        setSessions((prev) => {
          const prevMap = new Map<string, Session>();
          prev.forEach((s) => prevMap.set(s.id, s));
          return liveSessions.map((s) => {
            const existing = prevMap.get(s.id);
            const isStarted =
              (s.status === "in_progress" || !!existing?.isStarted) &&
              s.status !== "completed" &&
              s.status !== "cancelled" &&
              s.status !== "rejected";
            const formattedDuration = formatSessionDuration({
              duration: s.duration || existing?.duration,
              durationMinutes: (s as any).durationMinutes || (s as any).duration_minutes || existing?.durationMinutes,
              time: s.time || `${(s as any).startTime || "17:00"} - ${(s as any).endTime || "18:00"}`,
              startTime: (s as any).startTime,
              endTime: (s as any).endTime,
            });
            return {
              ...s,
              status: isStarted ? "in_progress" : s.status,
              role: s.mentorId === authUser.id ? "mentor" : "learner",
              mentor: (s as any).mentorName || s.mentor || "Mentor",
              learnerName: (s as any).learnerName || s.learnerName || "Learner",
              time: s.time || `${(s as any).startTime || "17:00"} - ${(s as any).endTime || "18:00"}`,
              duration: formattedDuration,
              durationMinutes:
                (s as any).durationMinutes ||
                (s as any).duration_minutes ||
                existing?.durationMinutes ||
                parseInt(formattedDuration, 10) ||
                30,
              isStarted: isStarted,
              ...(isStarted ? { startedAt: existing?.startedAt || new Date().toISOString() } : {}),
            };
          });
        });

        // Fetch session notes for completed sessions
        liveSessions
          .filter((s) => s.status === "completed")
          .forEach((s) => {
            noteApi
              .getNotes(s.id)
              .then((notes) => {
                if (notes && notes.length > 0) {
                  const latest = notes[0];
                  if (latest.fileName) {
                    setSessionPdfNotes((prev) => {
                      if (prev.some((n) => n.sessionId === s.id)) return prev;
                      return [
                        {
                          id: latest.id,
                          sessionId: s.id,
                          mentorId: s.mentorId,
                          learnerId: s.learnerId,
                          fileName: latest.fileName || "Session_Notes.pdf",
                          fileUrl: latest.fileUrl || "",
                          fileSize: latest.fileSizeBytes,
                          uploadedAt: latest.createdAt,
                        },
                        ...prev,
                      ];
                    });
                  }
                }
              })
              .catch(() => {});
          });
      }
    } catch (err) {
      console.warn("Using local sessions fallback:", err);
    }
  }, [authUser?.id]);

  // Initial load of cached reviews from localStorage
  useEffect(() => {
    try {
      const cached = JSON.parse(localStorage.getItem("skillswap_saved_reviews") || "[]");
      if (Array.isArray(cached) && cached.length > 0) {
        setReviews((prev) => {
          const map = new Map<string, SessionReview>();
          cached.forEach((r: SessionReview) => map.set(r.sessionId, r));
          prev.forEach((r) => map.set(r.sessionId, r));
          return Array.from(map.values());
        });
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!authUser?.id) return;

    refreshSessions();
    const interval = setInterval(refreshSessions, 2500);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        refreshSessions();
      }
    };

    window.addEventListener("focus", refreshSessions);
    window.addEventListener("online", refreshSessions);
    document.addEventListener("visibilitychange", handleVisibility);

    // Cross-tab and window instant session and review sync
    const handleChannelMessage = (event: MessageEvent) => {
      if (event.data?.type === "SESSION_STARTED") {
        const sid = event.data.sessionId;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sid
              ? { ...s, status: "in_progress", isStarted: true, startedAt: new Date().toISOString() }
              : s
          )
        );
        refreshSessions();
      } else if (event.data?.type === "SESSION_COMPLETED") {
        const sid = event.data.sessionId;
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sid
              ? { ...s, status: "completed", isStarted: false }
              : s
          )
        );
        refreshSessions();
      } else if (event.data?.type === "REVIEW_SUBMITTED") {
        const rev = event.data.review;
        if (rev) {
          setReviews((prev) => [rev, ...prev.filter((r) => r.sessionId !== rev.sessionId)]);
        }
        refreshSessions();
      }
    };

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("skillswap_session_channel");
        channel.addEventListener("message", handleChannelMessage);
      }
    } catch {
      // ignore
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "skillswap_session_event" && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.type === "SESSION_STARTED") {
            const sid = data.sessionId;
            setSessions((prev) =>
              prev.map((s) =>
                s.id === sid
                  ? { ...s, status: "in_progress", isStarted: true, startedAt: new Date().toISOString() }
                  : s
              )
            );
            refreshSessions();
          } else if (data.type === "SESSION_COMPLETED") {
            const sid = data.sessionId;
            setSessions((prev) =>
              prev.map((s) =>
                s.id === sid
                  ? { ...s, status: "completed", isStarted: false }
                  : s
              )
            );
            refreshSessions();
          } else if (data.type === "REVIEW_SUBMITTED" && data.review) {
            setReviews((prev) => [data.review, ...prev.filter((r) => r.sessionId !== data.review.sessionId)]);
            refreshSessions();
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refreshSessions);
      window.removeEventListener("online", refreshSessions);
      document.removeEventListener("visibilitychange", handleVisibility);
      channel?.removeEventListener("message", handleChannelMessage);
      channel?.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, [authUser?.id, refreshSessions]);

  const getUserById = (id: string | undefined): User | undefined => {
    if (!id) return undefined;
    return usersState.find((u) => u.id === String(id));
  };

  const switchUserById = (id: string) => {
    const found = getUserById(id);
    if (found) {
      setCurrentUser(found);
    }
  };

  const updateUserProfile = (userId: string, updates: Partial<User>) => {
    setUsersState((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          const updatedUser = { ...user, ...updates };
          if (currentUser.id === userId) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return user;
      })
    );
  };

  const updateUserAvailability = (
    userId: string,
    availability: import("@/data/mentors").DayAvailability[]
  ) => {
    // 1. Optimistically update local state immediately
    setUsersState((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          const updatedUser = { ...user, availability };
          if (currentUser.id === userId) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return user;
      })
    );

    // 2. Persist to PostgreSQL database so all other users see it immediately
    mentorApi
      .updateAvailability(availability)
      .then((res) => {
        if (res?.data) {
          setUsersState((prev) =>
            prev.map((user) => {
              if (user.id === userId) {
                const confirmed = { ...user, availability: res.data };
                if (currentUser.id === userId) {
                  setCurrentUser(confirmed);
                }
                return confirmed;
              }
              return user;
            })
          );
        }
      })
      .catch((err) => {
        console.warn("Failed to persist availability to PostgreSQL:", err);
      });
  };

  const addTeachingSkill = (userId: string, skill: string): boolean => {
    const trimmed = skill.trim();
    if (!trimmed) return false;

    let success = false;
    setUsersState((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          const exists = user.teaches.some(
            (s) => s.toLowerCase() === trimmed.toLowerCase()
          );
          if (exists) return user; // Prevent duplicate

          success = true;
          const updatedTeaches = [...user.teaches, trimmed];
          const updatedTeachingSkill = user.teachingSkill || trimmed;
          const updatedUser = {
            ...user,
            teaches: updatedTeaches,
            teachingSkill: updatedTeachingSkill,
          };
          if (currentUser.id === userId) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return user;
      })
    );
    return success;
  };

  const removeTeachingSkill = (userId: string, skill: string): boolean => {
    let success = false;
    setUsersState((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          success = true;
          const updatedTeaches = user.teaches.filter(
            (s) => s.toLowerCase() !== skill.toLowerCase()
          );
          const updatedTeachingSkill =
            updatedTeaches.length > 0 ? updatedTeaches[0] : "";
          const updatedUser = {
            ...user,
            teaches: updatedTeaches,
            teachingSkill: updatedTeachingSkill,
          };
          if (currentUser.id === userId) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return user;
      })
    );
    return success;
  };

  const addLearningSkill = (userId: string, skill: string): boolean => {
    const trimmed = skill.trim();
    if (!trimmed) return false;

    let success = false;
    setUsersState((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          const exists = user.learns.some(
            (s) => s.toLowerCase() === trimmed.toLowerCase()
          );
          if (exists) return user;

          success = true;
          const updatedLearns = [...user.learns, trimmed];
          const updatedUser = {
            ...user,
            learns: updatedLearns,
          };
          if (currentUser.id === userId) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return user;
      })
    );
    return success;
  };

  const removeLearningSkill = (userId: string, skill: string): boolean => {
    let success = false;
    setUsersState((prev) =>
      prev.map((user) => {
        if (user.id === userId) {
          success = true;
          const updatedLearns = user.learns.filter(
            (s) => s.toLowerCase() !== skill.toLowerCase()
          );
          const updatedUser = {
            ...user,
            learns: updatedLearns,
          };
          if (currentUser.id === userId) {
            setCurrentUser(updatedUser);
          }
          return updatedUser;
        }
        return user;
      })
    );
    return success;
  };

  const getUserReviews = (userId: string | undefined): SessionReview[] => {
    if (!userId) return [];
    return reviews.filter((r) => r.revieweeId === String(userId));
  };

  const getUserRating = (
    userId: string | undefined
  ): { rating: number; reviewCount: number } => {
    if (!userId) return { rating: 0, reviewCount: 0 };
    const userReviews = getUserReviews(userId);
    const user = getUserById(userId);

    if (userReviews.length === 0) {
      return {
        rating: user?.rating || 0,
        reviewCount: user?.reviewCount || 0,
      };
    }

    const totalStars = userReviews.reduce((sum, r) => sum + r.rating, 0);
    const avg = Number((totalStars / userReviews.length).toFixed(1));
    return {
      rating: avg,
      reviewCount: userReviews.length,
    };
  };

  const incomingRequests = sessions.filter(
    (s) => s.mentorId === currentUser.id && s.status === "pending" && !isInitialRequestExpired(s)
  );

  const outgoingRequests = sessions.filter(
    (s) => s.learnerId === currentUser.id && s.status === "pending" && !isInitialRequestExpired(s)
  );

  const getSessionById = (id: string | undefined): Session | undefined => {
    if (!id) return undefined;
    return sessions.find((item) => item.id === id);
  };

  const getReviewBySessionId = (
    sessionId: string | undefined
  ): SessionReview | undefined => {
    if (!sessionId) return undefined;
    return reviews.find((item) => item.sessionId === sessionId);
  };

  const addSession = async (newSession: Session): Promise<string> => {
    const tempId = newSession.id;
    setSessions((prev) => [newSession, ...prev]);
    let resolvedSessionId = tempId;

    // Asynchronously save booking to PostgreSQL if user is logged in
    if (authUser?.id && newSession.mentorId) {
      const cleanTime = (newSession.time || "17:00 - 18:00").replace(/[\u2013\u2014–—]/g, "-");
      const times = cleanTime.split("-").map((s) => s.trim());
      const durationNum = parseInt(newSession.duration?.match(/\d+/)?.[0] || "30", 10);
      try {
        const res = await sessionApi.bookSession({
          mentorId: newSession.mentorId,
          skillName: newSession.teachingSkill || newSession.topic,
          topic: newSession.topic,
          sessionDescription: newSession.sessionDescription,
          learnerGoal: newSession.learnerGoal,
          scheduledDate: newSession.date,
          startTime: times[0] || "17:00",
          endTime: times[1] || "18:00",
          durationMinutes: durationNum,
          credits: newSession.credits || 5,
          status: newSession.status || "pending",
        });
        if (res?.sessionId) {
          resolvedSessionId = res.sessionId;
          setSessions((prev) =>
            prev.map((s) => (s.id === tempId ? { ...s, id: res.sessionId } : s))
          );
        }
      } catch (err) {
        console.warn("Backend booking sync note:", err);
      }
    }

    // Notify the mentor about the new incoming request
    addNotification({
      userId: newSession.mentorId,
      type: "session",
      title: "New session request",
      message: `${newSession.learnerName || currentUser.name || "A student"} requested a ${newSession.topic} session with you.`,
      timestamp: "Just now",
      relatedId: resolvedSessionId,
      relatedRoute: `/session-details/${resolvedSessionId}`,
      group: "today",
    });

    return resolvedSessionId;
  };

  const updateSessionTiming = async (
    sessionId: string,
    scheduledDate: string,
    startTime: string,
    endTime: string,
    status?: Session["status"]
  ): Promise<void> => {
    // 1. Optimistic update
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            date: scheduledDate,
            time: `${startTime} – ${endTime}`,
            ...(status ? { status } : {}),
          };
        }
        return s;
      })
    );

    // 2. Persist to PostgreSQL backend
    try {
      await sessionApi.updateSessionTiming(sessionId, {
        scheduledDate,
        startTime,
        endTime,
        status,
      });
    } catch (err) {
      console.warn("Could not sync updated timing to database:", err);
    }
  };

  const getPendingRescheduleForSession = (
    sessionId: string | undefined
  ): RescheduleRequest | undefined => {
    if (!sessionId) return undefined;
    return rescheduleRequests.find(
      (r) => r.sessionId === sessionId && r.status === "pending" && !isRescheduleRequestExpired(r)
    );
  };

  const createRescheduleRequest = ({
    sessionId,
    proposedDate,
    proposedTime,
    reason,
  }: {
    sessionId: string;
    proposedDate: string;
    proposedTime: string;
    reason?: string;
  }): { success: boolean; error?: string } => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) {
      return { success: false, error: "Session not found." };
    }

    if (session.status !== "upcoming") {
      return {
        success: false,
        error: `Only upcoming sessions can be rescheduled. Current status: ${session.status}`,
      };
    }

    const isMentor = currentUser.id === session.mentorId;
    const isLearner = currentUser.id === session.learnerId;
    if (!isMentor && !isLearner) {
      return {
        success: false,
        error: "You are not a participant in this session.",
      };
    }

    // Check if there is already a pending reschedule request
    const existingPending = rescheduleRequests.find(
      (r) => r.sessionId === sessionId && r.status === "pending" && !isRescheduleRequestExpired(r)
    );
    if (existingPending) {
      return {
        success: false,
        error: "A reschedule request is already pending for this session.",
      };
    }

    // Check that proposed start time is in the future
    const proposedStartDt = getSessionStartDateTime(proposedDate, proposedTime);
    if (!proposedStartDt || proposedStartDt.getTime() <= Date.now()) {
      return {
        success: false,
        error: "The proposed date and time must be in the future.",
      };
    }

    // Validate mentor availability & schedule conflicts ONLY if learner is requesting
    if (isLearner) {
      const mentorUser = getUserById(session.mentorId);
      const validation = validateSessionSchedule(
        mentorUser,
        proposedDate,
        proposedTime,
        session.duration,
        sessions,
        session.id
      );

      if (!validation.valid) {
        return {
          success: false,
          error: validation.error || "The proposed time slot is unavailable.",
        };
      }
    }

    const requestedById = currentUser.id;
    const requestedForId = isMentor ? session.learnerId : session.mentorId;
    const newRequestId = `resched-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const newRequest: RescheduleRequest = {
      id: newRequestId,
      sessionId: session.id,
      requestedById,
      requestedForId,
      mentorId: session.mentorId,
      learnerId: session.learnerId,
      topic: session.topic,
      currentDate: session.date,
      currentTime: session.time,
      proposedDate,
      proposedTime,
      duration: session.duration,
      status: "pending",
      createdAt: new Date().toISOString(),
      reason: reason?.trim() || undefined,
    };

    setRescheduleRequests((prev) => [newRequest, ...prev]);

    // Notify recipient
    addNotification({
      userId: requestedForId,
      type: "session",
      title: "Reschedule Proposed",
      message: `${currentUser.name} proposed to reschedule your ${session.topic} session to ${proposedDate} at ${proposedTime}.`,
      timestamp: "Just now",
      relatedId: session.id,
      relatedRoute: `/session-details/${session.id}`,
      group: "today",
    });

    return { success: true };
  };

  const acceptRescheduleRequest = (
    requestId: string
  ): { success: boolean; error?: string } => {
    const req = rescheduleRequests.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, error: "Reschedule request not found." };
    }

    if (req.status !== "pending") {
      return { success: false, error: `Reschedule request is already ${req.status}.` };
    }

    if (isRescheduleRequestExpired(req)) {
      setRescheduleRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status: "expired" } : r))
      );
      return { success: false, error: "This reschedule proposal has expired." };
    }

    if (currentUser.id !== req.requestedForId) {
      return { success: false, error: "Only the recipient can accept this reschedule proposal." };
    }

    const session = sessions.find((s) => s.id === req.sessionId);
    if (!session || session.status !== "upcoming") {
      return { success: false, error: "Associated session is no longer active." };
    }

    // 1. Update reschedule request status
    setRescheduleRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: "accepted", respondedAt: new Date().toISOString() }
          : r
      )
    );

    // 2. Update actual session date and time
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === req.sessionId) {
          return {
            ...s,
            date: req.proposedDate,
            time: req.proposedTime,
          };
        }
        return s;
      })
    );

    // 3. Notify requester
    addNotification({
      userId: req.requestedById,
      type: "session",
      title: "Reschedule Accepted",
      message: `${currentUser.name} accepted your reschedule proposal for ${req.topic}. The session is now scheduled for ${req.proposedDate} at ${req.proposedTime}.`,
      timestamp: "Just now",
      relatedId: session.id,
      relatedRoute: `/session-details/${session.id}`,
      group: "today",
    });

    return { success: true };
  };

  const rejectRescheduleRequest = (
    requestId: string
  ): { success: boolean; error?: string } => {
    const req = rescheduleRequests.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, error: "Reschedule request not found." };
    }

    if (req.status !== "pending") {
      return { success: false, error: `Reschedule request is already ${req.status}.` };
    }

    if (currentUser.id !== req.requestedForId) {
      return { success: false, error: "Only the recipient can decline this reschedule proposal." };
    }

    // Update request status to rejected
    setRescheduleRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: "rejected", respondedAt: new Date().toISOString() }
          : r
      )
    );

    // Notify requester
    addNotification({
      userId: req.requestedById,
      type: "session",
      title: "Reschedule Declined",
      message: `${currentUser.name} declined your reschedule proposal for ${req.topic}. The session remains at its original scheduled time.`,
      timestamp: "Just now",
      relatedId: req.sessionId,
      relatedRoute: `/session-details/${req.sessionId}`,
      group: "today",
    });

    return { success: true };
  };

  const cancelRescheduleRequest = (
    requestId: string
  ): { success: boolean; error?: string } => {
    const req = rescheduleRequests.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, error: "Reschedule request not found." };
    }

    if (req.status !== "pending") {
      return { success: false, error: `Reschedule request is already ${req.status}.` };
    }

    if (currentUser.id !== req.requestedById) {
      return { success: false, error: "Only the requester can cancel this reschedule proposal." };
    }

    // Update request status to cancelled
    setRescheduleRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? { ...r, status: "cancelled", respondedAt: new Date().toISOString() }
          : r
      )
    );

    // Notify recipient
    addNotification({
      userId: req.requestedForId,
      type: "session",
      title: "Reschedule Cancelled",
      message: `${currentUser.name} cancelled the reschedule proposal for ${req.topic}. The session remains at its original scheduled time.`,
      timestamp: "Just now",
      relatedId: req.sessionId,
      relatedRoute: `/session-details/${req.sessionId}`,
      group: "today",
    });

    return { success: true };
  };

  const rescheduleSession = (
    id: string,
    newDate: string,
    newTime: string
  ): boolean => {
    let updated = false;
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === id) {
          updated = true;
          return {
            ...session,
            date: newDate,
            time: newTime,
          };
        }
        return session;
      })
    );
    return updated;
  };

  const cancelSession = (id: string): boolean => {
    const targetSession = sessions.find((s) => s.id === id);
    if (!targetSession || (targetSession.status !== "upcoming" && !targetSession.isStarted)) {
      return false;
    }

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === id) {
          return {
            ...session,
            status: "cancelled",
            isStarted: false,
          };
        }
        return session;
      })
    );

    // Also cancel any pending reschedule requests for this session
    setRescheduleRequests((prev) =>
      prev.map((r) =>
        r.sessionId === id && r.status === "pending"
          ? { ...r, status: "cancelled" }
          : r
      )
    );

    // Notify the counterpart
    const isLearner = currentUser.id === targetSession.learnerId;
    const recipientId = isLearner ? targetSession.mentorId : targetSession.learnerId;
    const cancellerName = currentUser.name;

    addNotification({
      userId: recipientId,
      type: "session",
      title: "Session Cancelled",
      message: `${cancellerName} cancelled the upcoming session on ${targetSession.topic}.`,
      timestamp: "Just now",
      relatedId: targetSession.id,
      relatedRoute: "/my-sessions",
      group: "today",
    });

    if (!id.startsWith("s-")) {
      sessionApi.updateSessionStatus(id, "cancelled").catch((err) => {
        console.warn("Could not sync cancelSession to backend:", err);
      });
    }

    return true;
  };

  const cancelRequest = (id: string): boolean => {
    const targetSession = sessions.find(
      (s) => s.id === id && s.status === "pending"
    );
    if (!targetSession) return false;

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === id && session.status === "pending") {
          return {
            ...session,
            status: "cancelled",
          };
        }
        return session;
      })
    );

    // Notify the mentor that the request was cancelled
    addNotification({
      userId: targetSession.mentorId,
      type: "session",
      title: "Request Cancelled",
      message: `${currentUser.name} cancelled their request for ${targetSession.topic}.`,
      timestamp: "Just now",
      relatedId: targetSession.id,
      relatedRoute: "/mentor-requests",
      group: "today",
    });

    if (!id.startsWith("s-")) {
      sessionApi.updateSessionStatus(id, "cancelled").catch((err) => {
        console.warn("Could not sync cancelRequest to backend:", err);
      });
    }

    return true;
  };

  // Mentor accepts a pending request -> status becomes "upcoming", 0 credit deduction
  const acceptRequest = (id: string): boolean => {
    const targetSession = sessions.find(
      (s) => s.id === id && s.status === "pending"
    );
    if (!targetSession) return false;

    // Prevent accepting expired requests
    if (isInitialRequestExpired(targetSession)) {
      return false;
    }

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === id && session.status === "pending") {
          return {
            ...session,
            status: "upcoming",
          };
        }
        return session;
      })
    );

    // Notify the learner that the request was accepted
    addNotification({
      userId: targetSession.learnerId,
      type: "session",
      title: "Request Accepted",
      message: `${targetSession.mentor} accepted your ${targetSession.topic} session request.`,
      timestamp: "Just now",
      relatedId: targetSession.id,
      relatedRoute: `/session-details/${targetSession.id}`,
      group: "today",
    });

    if (!id.startsWith("s-")) {
      sessionApi.updateSessionStatus(id, "upcoming").catch((err) => {
        console.warn("Could not sync acceptRequest to backend:", err);
      });
    }

    return true;
  };

  // Mentor rejects a pending request -> status becomes "rejected", 0 credit deduction
  const rejectRequest = (id: string): boolean => {
    const targetSession = sessions.find(
      (s) => s.id === id && s.status === "pending"
    );
    if (!targetSession) return false;

    // Prevent rejecting expired requests
    if (isInitialRequestExpired(targetSession)) {
      return false;
    }

    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === id && session.status === "pending") {
          return {
            ...session,
            status: "rejected",
          };
        }
        return session;
      })
    );

    // Notify the learner that the request was declined
    addNotification({
      userId: targetSession.learnerId,
      type: "session",
      title: "Request Declined",
      message: `${targetSession.mentor} declined your ${targetSession.topic} session request.`,
      timestamp: "Just now",
      relatedId: targetSession.id,
      relatedRoute: "/my-sessions",
      group: "today",
    });

    if (!id.startsWith("s-")) {
      sessionApi.updateSessionStatus(id, "cancelled").catch((err) => {
        console.warn("Could not sync rejectRequest to backend:", err);
      });
    }

    return true;
  };

  // Mentor starts the session at or after scheduled start time
  const startSession = (id: string): { success: boolean; error?: string } => {
    const targetSession = sessions.find((s) => s.id === id);
    if (!targetSession) {
      return { success: false, error: "Session not found" };
    }

    if (targetSession.status !== "upcoming") {
      return { success: false, error: `Cannot start a session with status '${targetSession.status}'` };
    }

    if (currentUser.id !== targetSession.mentorId) {
      return { success: false, error: "Only the mentor can start the session." };
    }

    if (isSessionBeforeStart(targetSession.date, targetSession.time)) {
      return { success: false, error: "Cannot start the session before the scheduled start time." };
    }

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: "in_progress",
            isStarted: true,
            startedAt: new Date().toISOString(),
          };
        }
        return s;
      })
    );

    // 1. Sync session status to PostgreSQL backend database
    sessionApi
      .updateSessionStatus(id, "in_progress")
      .then(() => {
        refreshSessions();
      })
      .catch((err) => {
        console.warn("Backend startSession status update note:", err);
      });

    // 2. Broadcast immediately across open tabs and windows
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("skillswap_session_channel");
        channel.postMessage({ type: "SESSION_STARTED", sessionId: id });
        channel.close();
      }
      localStorage.setItem(
        "skillswap_session_event",
        JSON.stringify({ type: "SESSION_STARTED", sessionId: id, timestamp: Date.now() })
      );
    } catch {
      // ignore
    }

    // Notify the learner that the mentor started the session
    addNotification({
      userId: targetSession.learnerId,
      type: "session",
      title: "Session Started!",
      message: `${currentUser.name} has started the session on ${targetSession.topic}. Click to enter the room now!`,
      timestamp: "Just now",
      relatedId: targetSession.id,
      relatedRoute: `/session-room/${targetSession.id}`,
      group: "today",
    });

    return { success: true };
  };

  // Mentor ends the session -> completes session & processes credit exchange (-5 learner, +10 mentor)
  const endSession = (id: string): { success: boolean; error?: string } => {
    const targetSession = sessions.find((s) => s.id === id);
    if (!targetSession) {
      return { success: false, error: "Session not found" };
    }

    if (currentUser.id !== targetSession.mentorId) {
      return { success: false, error: "Only the mentor can end the session." };
    }

    return completeSession(id);
  };

  const completeSession = (
    id: string,
    roleOverride?: "mentor" | "learner"
  ): { success: boolean; error?: string } => {
    const targetSession = sessions.find((s) => s.id === id);
    if (!targetSession) {
      return { success: false, error: "Session not found" };
    }

    if (targetSession.status === "completed") {
      return { success: true };
    }

    const creditResult = completeSessionAndProcessCredits(targetSession);

    if (!creditResult.success) {
      return creditResult;
    }

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          return {
            ...s,
            status: "completed",
            isStarted: false,
            role: roleOverride || s.role || "learner",
          };
        }
        return s;
      })
    );

    // Sync completion with backend PostgreSQL
    sessionApi
      .updateSessionStatus(id, "completed")
      .catch((err) => {
        console.warn("Backend completion sync note:", err);
      });

    // Broadcast session completion immediately across open tabs and windows
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const channel = new BroadcastChannel("skillswap_session_channel");
        channel.postMessage({ type: "SESSION_COMPLETED", sessionId: id });
        channel.close();
      }
      localStorage.setItem(
        "skillswap_session_event",
        JSON.stringify({ type: "SESSION_COMPLETED", sessionId: id, timestamp: Date.now() })
      );
    } catch {
      // ignore
    }

    // Notify learner about completion
    addNotification({
      userId: targetSession.learnerId,
      type: "session",
      title: "Session Completed",
      message: `Your mentorship session on ${targetSession.topic} with ${targetSession.mentor} is completed. Feel free to leave a review!`,
      timestamp: "Just now",
      relatedId: targetSession.id,
      relatedRoute: `/session-details/${targetSession.id}`,
      group: "today",
    });

    // Notify mentor about teaching reward
    addNotification({
      userId: targetSession.mentorId,
      type: "credit",
      title: "Credits earned",
      message: `You earned +10 credits for completing your mentoring session on ${targetSession.topic}.`,
      timestamp: "Just now",
      relatedId: "wallet",
      relatedRoute: "/wallet",
      group: "today",
    });

    return { success: true };
  };

  const submitReview = (
    review: Omit<SessionReview, "submittedAt" | "reviewerId" | "revieweeId"> & { reviewerId?: string; revieweeId?: string }
  ): boolean => {
    if (reviews.some((item) => item.sessionId === review.sessionId)) {
      return false;
    }

    const targetSession = sessions.find((s) => s.id === review.sessionId);
    if (!targetSession) {
      return false;
    }

    // Role check: ONLY the learner of the session can submit a review
    if (currentUser.id !== targetSession.learnerId) {
      return false;
    }

    const newReview: SessionReview = {
      sessionId: review.sessionId,
      reviewerId: targetSession.learnerId,
      revieweeId: targetSession.mentorId,
      mentor: review.mentor,
      topic: review.topic,
      rating: review.rating,
      reviewText: review.reviewText,
      comment: review.reviewText,
      submittedAt: new Date().toISOString(),
    };

    setReviews((prev) => {
      const updated = [newReview, ...prev.filter((r) => r.sessionId !== newReview.sessionId)];
      try {
        localStorage.setItem("skillswap_saved_reviews", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    // Broadcast review immediately across open tabs and windows
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const ch = new BroadcastChannel("skillswap_session_channel");
        ch.postMessage({ type: "REVIEW_SUBMITTED", sessionId: review.sessionId, review: newReview });
        ch.close();
      }
      localStorage.setItem(
        "skillswap_session_event",
        JSON.stringify({ type: "REVIEW_SUBMITTED", sessionId: review.sessionId, review: newReview, timestamp: Date.now() })
      );
    } catch {}

    // Persist review to backend PostgreSQL
    reviewApi
      .createReview({
        sessionId: review.sessionId,
        rating: review.rating,
        comment: review.reviewText,
      })
      .then(() => {
        refreshSessions();
      })
      .catch((err) => {
        console.warn("Could not persist review to backend, keeping local copy:", err);
      });

    // Notify mentor about the review
    addNotification({
      userId: targetSession.mentorId,
      type: "review",
      title: "Review submitted",
      message: `${currentUser.name} left you a ${review.rating}-star review for peer mentoring.`,
      timestamp: "Just now",
      relatedId: targetSession.id,
      relatedRoute: `/session-details/${targetSession.id}`,
      group: "today",
    });

    return true;
  };

  const uploadSessionNote = ({
    sessionId,
    file,
  }: {
    sessionId: string;
    file: File | { fileName: string; fileUrl: string; fileSize?: number };
  }): { success: boolean; error?: string } => {
    const targetSession = sessions.find((s) => s.id === sessionId);
    if (!targetSession) {
      return { success: false, error: "Session not found." };
    }

    if (targetSession.status !== "completed") {
      return {
        success: false,
        error: "Notes can only be uploaded for completed sessions.",
      };
    }

    if (currentUser.id !== targetSession.mentorId) {
      return {
        success: false,
        error: "Only the mentor of this session can upload notes.",
      };
    }

    let fileName = "";
    let fileUrl = "";
    let fileSize = 0;

    if (file instanceof File) {
      const isPdfMime = file.type === "application/pdf";
      const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
      if (!isPdfMime && !isPdfExt) {
        return {
          success: false,
          error: "Please upload a PDF file.",
        };
      }

      const maxBytes = 10 * 1024 * 1024;
      if (file.size > maxBytes) {
        return {
          success: false,
          error: "PDF must be smaller than 10 MB.",
        };
      }

      fileName = file.name;
      fileSize = file.size;
      fileUrl = URL.createObjectURL(file);
    } else {
      if (!file.fileName.toLowerCase().endsWith(".pdf")) {
        return {
          success: false,
          error: "Please upload a PDF file.",
        };
      }
      if (file.fileSize && file.fileSize > 10 * 1024 * 1024) {
        return {
          success: false,
          error: "PDF must be smaller than 10 MB.",
        };
      }
      fileName = file.fileName;
      fileUrl = file.fileUrl;
      fileSize = file.fileSize || 1024 * 500;
    }

    const noteId = `note-${sessionId}`;
    const newNote: SessionPdfNote = {
      id: noteId,
      sessionId: targetSession.id,
      mentorId: targetSession.mentorId,
      learnerId: targetSession.learnerId,
      fileName,
      fileUrl,
      fileSize,
      uploadedAt: new Date().toISOString(),
    };

    setSessionPdfNotes((prev) => {
      const filtered = prev.filter((n) => n.sessionId !== sessionId);
      return [newNote, ...filtered];
    });

    // Persist note to backend PostgreSQL
    noteApi
      .saveNotes(sessionId, {
        fileName,
        fileUrl,
        fileSizeBytes: fileSize,
        fileType: "application/pdf",
        summary: `Notes for session on ${targetSession.topic}`,
      })
      .catch((err) => {
        console.warn("Could not persist session notes to backend, keeping local copy:", err);
      });

    // Notify learner
    addNotification({
      userId: targetSession.learnerId,
      type: "session",
      title: "Notes Uploaded",
      message: `${currentUser.name} uploaded notes for your ${targetSession.topic} session.`,
      timestamp: "Just now",
      relatedId: targetSession.id,
      relatedRoute: `/session-notes/${targetSession.id}`,
      group: "today",
    });

    return { success: true };
  };

  const getSessionPdfNote = (
    sessionId: string | undefined
  ): SessionPdfNote | undefined => {
    if (!sessionId) return undefined;
    return sessionPdfNotes.find((n) => n.sessionId === sessionId);
  };

  return (
    <SessionContext.Provider
      value={{
        sessions,
        reviews,
        users: usersState,
        currentUser,
        setCurrentUser,
        switchUserById,
        getUserById,
        updateUserProfile,
        updateUserAvailability,
        addTeachingSkill,
        removeTeachingSkill,
        addLearningSkill,
        removeLearningSkill,
        getUserReviews,
        getUserRating,
        incomingRequests,
        outgoingRequests,
        currentUserRole,
        setCurrentUserRole,
        getSessionById,
        getReviewBySessionId,
        rescheduleRequests,
        createRescheduleRequest,
        acceptRescheduleRequest,
        rejectRescheduleRequest,
        cancelRescheduleRequest,
        getPendingRescheduleForSession,
        rescheduleSession,
        cancelSession,
        cancelRequest,
        acceptRequest,
        rejectRequest,
        startSession,
        endSession,
        completeSession,
        submitReview,
        addSession,
        updateSessionTiming,
        sessionPdfNotes,
        uploadSessionNote,
        getSessionPdfNote,
        refreshSessions,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};
