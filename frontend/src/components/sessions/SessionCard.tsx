import { useState } from "react";
import {
  CalendarDays,
  Clock3,
  Coins,
  User,
  Radio,
  FileText,
  X,
  Sparkles,
  AlertCircle,
  Star,
  CheckCircle2,
  CalendarClock,
  Check,
  Upload,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { Session } from "@/data/sessions";
import { useSessions } from "@/hooks/useSessions";
import {
  isSessionBeforeStart,
  formatStartTimeOnly,
  isSessionExpired,
  isInitialRequestExpired,
  formatSessionDuration,
} from "@/utils/sessionTime";
import CancelSessionModal from "./CancelSessionModal";
import CancelRequestModal from "./CancelRequestModal";
import UploadNotesModal from "../session-notes/UploadNotesModal";

type SessionCardProps = Session;

const statusStyles: Record<
  "upcoming" | "in_progress" | "pending" | "completed" | "cancelled" | "rejected",
  { badge: string; text: string }
> = {
  upcoming: {
    badge: "bg-green-100 text-green-700",
    text: "Upcoming",
  },
  in_progress: {
    badge: "bg-emerald-100 text-emerald-800",
    text: "In Progress",
  },
  pending: {
    badge: "bg-amber-100 text-amber-700",
    text: "Pending",
  },
  completed: {
    badge: "bg-blue-100 text-blue-700",
    text: "Completed",
  },
  cancelled: {
    badge: "bg-red-100 text-red-700",
    text: "Cancelled",
  },
  rejected: {
    badge: "bg-red-100 text-red-700",
    text: "Declined",
  },
};

const SessionCard = (session: SessionCardProps) => {
  const {
    id,
    mentor,
    topic,
    date,
    time,
    status,
    learnerId,
    isStarted,
  } = session;
  const navigate = useNavigate();
  const {
    currentUser,
    reviews,
    getPendingRescheduleForSession,
    acceptRescheduleRequest,
    rejectRescheduleRequest,
    cancelRescheduleRequest,
    getSessionPdfNote,
  } = useSessions();
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelRequestModalOpen, setIsCancelRequestModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const isLearner = currentUser.id === learnerId;
  const isMentor = currentUser.id === session.mentorId;
  const liveIsStarted = Boolean(isStarted && status !== "completed" && status !== "cancelled" && status !== "rejected");
  const hasReview = reviews.some((r) => r.sessionId === id);
  const isBeforeStart = isSessionBeforeStart(date, time);
  const startTimeDisplay = formatStartTimeOnly(time);
  const isExpired = isSessionExpired(session);
  const isInitialExpired = isInitialRequestExpired(session);
  const pdfNote = getSessionPdfNote(id);

  const pendingReschedule = getPendingRescheduleForSession(id);
  const isRescheduleRecipient =
    pendingReschedule && currentUser.id === pendingReschedule.requestedForId;
  const isRescheduleRequester =
    pendingReschedule && currentUser.id === pendingReschedule.requestedById;

  const otherPartyName = isMentor ? session.learnerName || "Learner" : mentor;
  const currentStatus = statusStyles[status];

  // Dynamic role-specific subtitle
  let roleSubtitle = "";
  if (status === "completed") {
    if (isLearner) {
      roleSubtitle = hasReview
        ? `You learned ${topic} from ${mentor}.`
        : `You learned ${topic} from ${mentor}. Please review your mentor to complete this session feedback.`;
    } else {
      roleSubtitle = `You taught ${topic} to ${session.learnerName || "your student"}.`;
    }
  } else if (liveIsStarted) {
    roleSubtitle = isLearner
      ? `Live session in progress with ${mentor}.`
      : `Live session in progress with ${session.learnerName || "your student"}.`;
  } else if (status === "upcoming") {
    if (isExpired) {
      roleSubtitle = `This session expired because it was not started during its scheduled time window.`;
    } else {
      roleSubtitle = isLearner
        ? `You are learning from ${mentor}.`
        : `You are teaching ${session.learnerName || "your student"}.`;
    }
  } else if (status === "pending") {
    if (isInitialExpired) {
      roleSubtitle = `This session request expired because its requested start time has passed.`;
    } else {
      roleSubtitle = isLearner
        ? `Waiting for ${mentor} to accept your request.`
        : `Incoming request from ${session.learnerName || "Student"}.`;
    }
  } else if (status === "cancelled") {
    roleSubtitle = isLearner
      ? `Cancelled session with ${mentor}.`
      : `Cancelled session with ${session.learnerName || "Student"}.`;
  } else {
    roleSubtitle = isLearner
      ? `Declined by ${mentor}.`
      : `Declined request from ${session.learnerName || "Student"}.`;
  }

  // Dynamic credit indicator
  let creditsDisplay = "5 Credits";
  let creditsColor = "text-violet-600";
  if (status === "completed") {
    if (isLearner) {
      creditsDisplay = "-5 Credits";
      creditsColor = "text-red-600 font-semibold";
    } else {
      creditsDisplay = "+10 Credits";
      creditsColor = "text-emerald-600 font-semibold";
    }
  } else if (isExpired || isInitialExpired || status === "cancelled" || status === "rejected") {
    creditsDisplay = "0 Credits";
    creditsColor = "text-slate-500";
  }

  const handleCardClick = () => {
    navigate(`/session-details/${id}`);
  };

  return (
    <section
      onClick={handleCardClick}
      className="cursor-pointer rounded-3xl border border-violet-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {/* Status Badge */}
          <div className="flex flex-wrap items-center gap-3">
            {liveIsStarted ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1.5 text-xs font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                In Progress
              </span>
            ) : !pendingReschedule && (isExpired || isInitialExpired) ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 text-xs font-semibold text-slate-700">
                <AlertCircle size={13} className="text-slate-500" />
                Expired
              </span>
            ) : (
              <span
                className={`rounded-full px-4 py-1.5 text-xs font-semibold ${currentStatus.badge}`}
              >
                {currentStatus.text}
              </span>
            )}

            {/* Pending Reschedule Badge */}
            {pendingReschedule && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-300 px-3 py-1 text-xs font-bold text-amber-800">
                <CalendarClock size={13} className="text-amber-600" />
                Reschedule Proposed
              </span>
            )}

            {/* Completed status review indicator for learner */}
            {status === "completed" && isLearner && (
              hasReview ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  <CheckCircle2 size={13} />
                  Review Submitted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                  <Star size={13} className="fill-amber-500 text-amber-500" />
                  Review Required
                </span>
              )
            )}

            {/* Completed teaching reward for mentor */}
            {status === "completed" && isMentor && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                <Sparkles size={13} />
                +10 Credits Earned
              </span>
            )}
          </div>

          {/* Topic */}
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            {topic}
          </h2>

          <p
            className={`mt-1 text-sm font-medium ${
              status === "completed" && isLearner && !hasReview
                ? "text-amber-700 font-semibold"
                : isInitialExpired || isExpired
                ? "text-slate-500"
                : "text-violet-700"
            }`}
          >
            {roleSubtitle}
          </p>

          {/* Session Information */}
          <div className="mt-5 flex flex-wrap gap-6 text-slate-600">
            {/* Participant */}
            <div className="flex items-center gap-2 text-sm">
              <User size={18} className="text-violet-600" />
              <span>
                {isLearner
                  ? `Mentor: ${mentor}`
                  : `Learner: ${session.learnerName || "Student"}`}
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays size={18} className="text-violet-600" />
              {date}
            </div>

            {/* Time */}
            <div className="flex items-center gap-2 text-sm">
              <Clock3 size={18} className="text-violet-600" />
              {time}
            </div>

            {/* Credits */}
            <div className="flex items-center gap-2 text-sm">
              <Coins size={18} className="text-violet-600" />
              <span className={creditsColor}>{creditsDisplay}</span>
            </div>
          </div>
        </div>

        {/* Duration */}
        <div className="rounded-2xl bg-violet-50 px-6 py-5 text-center">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">
            Duration
          </p>

          <p className="mt-1 text-xl font-bold text-violet-700">
            {formatSessionDuration(session)}
          </p>
        </div>
      </div>

      {/* PENDING RESCHEDULE PROPOSAL BANNER */}
      {pendingReschedule && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-4.5"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <CalendarClock size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-950">
                  {isRescheduleRecipient
                    ? `${otherPartyName} proposed to reschedule this session:`
                    : "You proposed a new schedule:"}
                </p>
                <p className="text-xs font-semibold text-amber-800 mt-0.5">
                  Proposed: {pendingReschedule.proposedDate} at {pendingReschedule.proposedTime}
                </p>
                {pendingReschedule.reason && (
                  <p className="text-xs italic text-amber-700 mt-1">
                    Note: "{pendingReschedule.reason}"
                  </p>
                )}
              </div>
            </div>

            {isRescheduleRecipient && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => rejectRescheduleRequest(pendingReschedule.id)}
                  className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <X size={14} />
                  Reject Reschedule
                </button>
                <button
                  type="button"
                  onClick={() => acceptRescheduleRequest(pendingReschedule.id)}
                  className="cursor-pointer inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                >
                  <Check size={14} />
                  Accept Reschedule
                </button>
              </div>
            )}

            {isRescheduleRequester && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-amber-700 italic">
                  Waiting for response
                </span>
                <button
                  type="button"
                  onClick={() => cancelRescheduleRequest(pendingReschedule.id)}
                  className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  <X size={13} />
                  Cancel Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-7 flex flex-wrap items-center gap-3">
        {/* IN PROGRESS */}
        {liveIsStarted && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/session-room/${id}`);
            }}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-md transition-all hover:bg-emerald-700 hover:scale-105"
          >
            <Radio size={18} className="animate-pulse" />
            Enter Live Session
          </button>
        )}

        {/* UPCOMING (not started and not expired, or has pending reschedule) */}
        {!liveIsStarted && status === "upcoming" && (!isExpired || Boolean(pendingReschedule)) && (
          <>
            {isMentor ? (
              isBeforeStart ? (
                <button
                  type="button"
                  disabled
                  onClick={(event) => event.stopPropagation()}
                  className="cursor-not-allowed rounded-xl bg-slate-200 px-6 py-3 font-semibold text-slate-500 opacity-80"
                  title={`Start Session will be available at ${startTimeDisplay}`}
                >
                  Start Session (Starts at {startTimeDisplay})
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/session-room/${id}`);
                  }}
                  className="cursor-pointer rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white transition-all hover:bg-emerald-700 shadow-sm"
                >
                  Start Session
                </button>
              )
            ) : (
              /* LEARNER: Join Session is ALWAYS available (enters Waiting Room if before start) */
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/session-room/${id}`);
                }}
                className="cursor-pointer rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition-all hover:bg-violet-700 shadow-sm"
              >
                Join Session
              </button>
            )}

            {!pendingReschedule ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/reschedule-session/${id}`);
                }}
                className="cursor-pointer rounded-xl border border-violet-200 px-5 py-3 font-semibold text-violet-700 transition-all hover:bg-violet-50"
              >
                Reschedule
              </button>
            ) : (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/session-details/${id}`);
                }}
                className="cursor-pointer rounded-xl border border-amber-300 bg-amber-50 px-5 py-3 font-semibold text-amber-900 transition-all hover:bg-amber-100"
              >
                View Reschedule Proposal
              </button>
            )}

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsCancelModalOpen(true);
              }}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-5 py-3 font-semibold text-red-600 transition-all hover:bg-red-50"
            >
              <X size={16} />
              Cancel Session
            </button>
          </>
        )}

        {/* PENDING (not expired) */}
        {status === "pending" && !isInitialExpired && (
          <>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/session-details/${id}`);
              }}
              className="cursor-pointer rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white transition-all hover:bg-amber-600"
            >
              View Request
            </button>

            {isLearner && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsCancelRequestModalOpen(true);
                }}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-6 py-3 font-semibold text-red-600 transition-all hover:bg-red-50"
              >
                <X size={16} />
                Cancel Request
              </button>
            )}
          </>
        )}

        {/* PENDING EXPIRED / UPCOMING EXPIRED */}
        {(isInitialExpired || isExpired) && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              navigate(`/session-details/${id}`);
            }}
            className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            View Details
          </button>
        )}

        {/* COMPLETED */}
        {status === "completed" && (
          <>
            {/* MENTOR COMPLETED ACTIONS */}
            {isMentor && (
              <>
                {pdfNote ? (
                  <>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/session-notes/${id}`);
                      }}
                      className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition-all hover:bg-blue-700"
                    >
                      <FileText size={16} />
                      View Notes
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsUploadModalOpen(true);
                      }}
                      className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 font-semibold text-blue-700 transition-all hover:bg-blue-100"
                    >
                      <RefreshCw size={15} />
                      Replace Notes
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setIsUploadModalOpen(true);
                    }}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-bold text-white shadow-sm transition-all hover:bg-violet-700 hover:shadow-md"
                  >
                    <Upload size={16} />
                    Upload Notes
                  </button>
                )}
              </>
            )}

            {/* LEARNER COMPLETED ACTIONS */}
            {isLearner && (
              <>
                {pdfNote ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/session-notes/${id}`);
                    }}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-700"
                  >
                    <FileText size={16} />
                    View Notes
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
                    No notes available yet.
                  </span>
                )}

                {/* MANDATORY REVIEW FOR LEARNER ONLY */}
                {hasReview ? (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/review-session/${id}`);
                    }}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-3 font-semibold text-emerald-700 transition-all hover:bg-emerald-100"
                  >
                    <CheckCircle2 size={16} />
                    Review Submitted
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      navigate(`/review-session/${id}`);
                    }}
                    className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-bold text-white shadow-md transition-all hover:bg-violet-700 hover:scale-105"
                  >
                    <Star size={16} className="fill-amber-300 text-amber-300" />
                    Leave Review
                  </button>
                )}
              </>
            )}
          </>
        )}

        {/* REJECTED */}
        {status === "rejected" && isLearner && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              navigate("/explore");
            }}
            className="cursor-pointer rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition-all hover:bg-violet-700 shadow-sm"
          >
            Explore Mentors
          </button>
        )}
      </div>

      <CancelSessionModal
        session={session}
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
      />

      <CancelRequestModal
        session={session}
        isOpen={isCancelRequestModalOpen}
        onClose={() => setIsCancelRequestModalOpen(false)}
      />

      <UploadNotesModal
        session={session}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        existingNote={pdfNote}
      />
    </section>
  );
};

export default SessionCard;