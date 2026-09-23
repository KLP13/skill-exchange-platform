import {
  CalendarDays,
  Clock3,
  Timer,
  Coins,
  BookOpen,
  User,
  Check,
  X,
  Eye,
  Video,
  CalendarClock,
  FileText,
  AlertCircle,
  Upload,
  RefreshCw,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Session } from "@/data/sessions";
import { useSessions } from "@/hooks/useSessions";
import UserAvatar from "@/components/ui/UserAvatar";
import {
  isSessionBeforeStart,
  formatStartTimeOnly,
  isInitialRequestExpired,
  isSessionExpired,
} from "@/utils/sessionTime";
import UploadNotesModal from "../session-notes/UploadNotesModal";

type MentorRequestCardProps = {
  session: Session;
  onAccept: (session: Session) => void;
  onReject: (session: Session) => void;
};

const statusBadgeConfig: Record<
  "upcoming" | "in_progress" | "pending" | "completed" | "cancelled" | "rejected",
  { bg: string; text: string; label: string }
> = {
  pending: {
    bg: "bg-amber-100 text-amber-800",
    text: "text-amber-800",
    label: "Pending Request",
  },
  upcoming: {
    bg: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-800",
    label: "Upcoming Session",
  },
  in_progress: {
    bg: "bg-emerald-100 text-emerald-800",
    text: "text-emerald-800",
    label: "In Progress",
  },
  completed: {
    bg: "bg-blue-100 text-blue-800",
    text: "text-blue-800",
    label: "Completed Session",
  },
  cancelled: {
    bg: "bg-red-100 text-red-700",
    text: "text-red-700",
    label: "Cancelled",
  },
  rejected: {
    bg: "bg-slate-100 text-slate-700",
    text: "text-slate-700",
    label: "Declined",
  },
};

const MentorRequestCard = ({
  session,
  onAccept,
  onReject,
}: MentorRequestCardProps) => {
  const navigate = useNavigate();
  const {
    getSessionPdfNote,
    getPendingRescheduleForSession,
    acceptRescheduleRequest,
    rejectRescheduleRequest,
    currentUser,
    getUserById,
  } = useSessions();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const pdfNote = getSessionPdfNote(session.id);
  const pendingReschedule = getPendingRescheduleForSession(session.id);
  const isRescheduleRecipient =
    pendingReschedule && currentUser.id === pendingReschedule.requestedForId;
  const isRescheduleRequester =
    pendingReschedule && currentUser.id === pendingReschedule.requestedById;

  const learnerObj = getUserById(session.learnerId);
  const learnerName = session.learnerName || learnerObj?.name || "Student Learner";

  const isInitialExpired = isInitialRequestExpired(session);
  const isUpcomingExpired = isSessionExpired(session);

  let badgeLabel = statusBadgeConfig[session.status]?.label || "Pending Request";
  let badgeBg = statusBadgeConfig[session.status]?.bg || "bg-amber-100 text-amber-800";

  if (!pendingReschedule && (isInitialExpired || isUpcomingExpired)) {
    badgeLabel = "Expired";
    badgeBg = "bg-slate-100 text-slate-700";
  }

  return (
    <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm transition-all duration-200 hover:border-violet-300 hover:shadow-md">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* Learner & Session Info */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <UserAvatar
              avatar={learnerObj?.avatar}
              name={learnerName}
              sizeClassName="h-12 w-12"
              textClassName="text-base font-bold"
              className="rounded-2xl"
            />

            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-bold text-slate-900">
                  {learnerName}
                </h3>
                <span
                  className={`rounded-full px-3 py-0.5 text-xs font-bold ${badgeBg}`}
                >
                  {badgeLabel}
                </span>
                {pendingReschedule && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-300 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                    <CalendarClock size={12} className="text-amber-600" />
                    Reschedule Proposed
                  </span>
                )}
              </div>

              <p className="flex items-center gap-1.5 text-xs text-slate-500">
                <User size={13} />
                Student • Peer Mentorship
              </p>
            </div>
          </div>

          <div>
            <h4 className="flex items-center gap-2 text-base font-semibold text-slate-800">
              <BookOpen size={16} className="text-violet-600" />
              {session.topic}
            </h4>

            {session.learnerGoal && (
              <p className="mt-1.5 line-clamp-2 max-w-xl text-xs leading-relaxed text-slate-600 italic bg-violet-50/50 rounded-xl p-2.5 border border-violet-100">
                "{session.learnerGoal}"
              </p>
            )}

            {isInitialExpired && (
              <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
                <AlertCircle size={13} className="text-slate-400" />
                This session request expired because its requested start time has passed.
              </p>
            )}
          </div>

          {/* Schedule Details Grid */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
              <CalendarDays size={14} className="text-violet-600" />
              {session.date}
            </span>

            <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
              <Clock3 size={14} className="text-violet-600" />
              {session.time}
            </span>

            <span className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 border border-slate-100">
              <Timer size={14} className="text-violet-600" />
              {session.duration}
            </span>

            <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700 border border-emerald-100 font-semibold">
              <Coins size={14} className="text-emerald-600" />
              +10 Credits at completion
            </span>
          </div>

          {/* Pending Reschedule Proposal Banner */}
          {pendingReschedule && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <CalendarClock size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-950">
                      {isRescheduleRecipient
                        ? `${learnerName} proposed a new schedule:`
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
                      className="cursor-pointer inline-flex items-center gap-1 rounded-xl border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                    >
                      <X size={14} />
                      Reject Reschedule
                    </button>
                    <button
                      type="button"
                      onClick={() => acceptRescheduleRequest(pendingReschedule.id)}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700"
                    >
                      <Check size={14} />
                      Accept Reschedule
                    </button>
                  </div>
                )}

                {isRescheduleRequester && (
                  <span className="text-xs font-semibold text-amber-700 italic">
                    Waiting for learner response
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-4 lg:border-t-0 lg:pt-0">
          {session.status === "pending" && !isInitialExpired && (
            <>
              <Link
                to={`/session-details/${session.id}`}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-xs font-semibold text-violet-700 shadow-xs transition hover:bg-violet-50 hover:border-violet-300"
              >
                <Eye size={15} />
                View Request
              </Link>

              <button
                type="button"
                onClick={() => onReject(session)}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-semibold text-red-600 shadow-xs transition hover:bg-red-50 hover:border-red-300"
              >
                <X size={15} />
                Decline
              </button>

              <button
                type="button"
                onClick={() => onAccept(session)}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
              >
                <Check size={15} />
                Accept Request
              </button>
            </>
          )}

          {session.status === "pending" && isInitialExpired && (
            <Link
              to={`/session-details/${session.id}`}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100"
            >
              <Eye size={15} />
              View Details
            </Link>
          )}

          {session.status === "upcoming" && !isUpcomingExpired && (
            <>
              {isSessionBeforeStart(session.date, session.time) ? (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed inline-flex items-center gap-1.5 rounded-xl bg-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-500 opacity-80 shadow-xs"
                  title={`Start Session will be available at ${formatStartTimeOnly(session.time)}`}
                >
                  <Video size={15} />
                  Starts at {formatStartTimeOnly(session.time)}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate(`/session-room/${session.id}`)}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700 hover:shadow-md"
                >
                  <Video size={15} />
                  Start Session
                </button>
              )}

              {!pendingReschedule ? (
                <button
                  type="button"
                  onClick={() => navigate(`/reschedule-session/${session.id}`)}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-xs font-semibold text-violet-700 shadow-xs transition hover:bg-violet-50"
                >
                  <CalendarClock size={15} />
                  Reschedule
                </button>
              ) : (
                <Link
                  to={`/session-details/${session.id}`}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 shadow-xs transition hover:bg-amber-100"
                >
                  <CalendarClock size={15} />
                  View Reschedule
                </Link>
              )}

              <Link
                to={`/session-details/${session.id}`}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
              >
                <Eye size={15} />
                Details
              </Link>
            </>
          )}

          {session.status === "upcoming" && isUpcomingExpired && (
            <Link
              to={`/session-details/${session.id}`}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-100"
            >
              <Eye size={15} />
              View Details
            </Link>
          )}

          {session.status === "completed" && (
            <>
              {pdfNote ? (
                <>
                  <button
                    type="button"
                    onClick={() => navigate(`/session-notes/${session.id}`)}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700"
                  >
                    <FileText size={15} />
                    View Notes
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2.5 text-xs font-semibold text-blue-700 shadow-xs transition hover:bg-blue-100"
                  >
                    <RefreshCw size={14} />
                    Replace Notes
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(true)}
                  className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-violet-700"
                >
                  <Upload size={14} />
                  Upload Notes
                </button>
              )}

              <Link
                to={`/session-details/${session.id}`}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
              >
                <Eye size={15} />
                Details
              </Link>
            </>
          )}

          {(session.status === "cancelled" || session.status === "rejected") && (
            <Link
              to={`/session-details/${session.id}`}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
            >
              <Eye size={15} />
              View Details
            </Link>
          )}
        </div>
      </div>

      <UploadNotesModal
        session={session}
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        existingNote={pdfNote}
      />
    </div>
  );
};

export default MentorRequestCard;
