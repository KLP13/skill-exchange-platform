import { ArrowLeft, Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@/data/sessions";
import { useSessions } from "@/hooks/useSessions";
import { isSessionExpired, isInitialRequestExpired } from "@/utils/sessionTime";

type SessionDetailsHeaderProps = {
  session: Session;
};

const statusBadgeStyles: Record<
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

const SessionDetailsHeader = ({ session }: SessionDetailsHeaderProps) => {
  const navigate = useNavigate();
  const { currentUser, getPendingRescheduleForSession } = useSessions();
  const isLearner = currentUser.id === session.learnerId;
  const currentStatus = statusBadgeStyles[session.status];
  const isExpired = isSessionExpired(session);
  const isInitialExpired = isInitialRequestExpired(session);
  const pendingReschedule = getPendingRescheduleForSession(session.id);
  const isRescheduleRecipient =
    pendingReschedule && currentUser.id === pendingReschedule.requestedForId;
  const otherPartyName = isLearner ? session.mentor : (session.learnerName || "Learner");

  let descriptionText = "";
  if (pendingReschedule) {
    descriptionText = isRescheduleRecipient
      ? `${otherPartyName} proposed to reschedule this session to ${pendingReschedule.proposedDate} at ${pendingReschedule.proposedTime}. Please accept or decline below.`
      : `You proposed to reschedule this session to ${pendingReschedule.proposedDate} at ${pendingReschedule.proposedTime}. Waiting for ${otherPartyName}'s response.`;
  } else if (session.status === "completed") {
    descriptionText = isLearner
      ? `You learned ${session.topic} from ${session.mentor}.`
      : `You taught ${session.topic} to ${session.learnerName || "Learner"}.`;
  } else if (session.isStarted) {
    descriptionText = isLearner
      ? `Live mentorship session on ${session.topic} with ${session.mentor} is in progress.`
      : `Live teaching session on ${session.topic} with ${session.learnerName || "Learner"} is in progress.`;
  } else if (session.status === "upcoming") {
    if (isExpired) {
      descriptionText = `This session expired because it was not started during its scheduled time window.`;
    } else {
      descriptionText = isLearner
        ? `Your upcoming mentorship session with ${session.mentor}.`
        : `Your upcoming teaching session with ${session.learnerName || "Learner"}.`;
    }
  } else if (session.status === "pending") {
    if (isInitialExpired) {
      descriptionText = `This session request has expired because its requested start time has passed.`;
    } else {
      descriptionText = isLearner
        ? `Your pending mentorship session request with ${session.mentor}.`
        : `Incoming mentorship session request from ${session.learnerName || "Learner"}.`;
    }
  } else if (session.status === "cancelled") {
    descriptionText = isLearner
      ? `Your cancelled mentorship session with ${session.mentor}.`
      : `Cancelled teaching session with ${session.learnerName || "Learner"}.`;
  } else {
    descriptionText = isLearner
      ? `Your declined mentorship session request with ${session.mentor}.`
      : `Declined mentorship request from ${session.learnerName || "Learner"}.`;
  }

  return (
    <section>
      {/* Back */}
      <button
        type="button"
        onClick={() => navigate("/my-sessions")}
        className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-violet-700"
      >
        <ArrowLeft size={18} />
        Back to My Sessions
      </button>

      {/* Heading */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight text-[#211653]">
              {session.topic}
            </h1>

            {session.isStarted && session.status !== "completed" && session.status !== "cancelled" && session.status !== "rejected" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold text-emerald-800">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                In Progress
              </span>
            ) : pendingReschedule ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3.5 py-1 text-xs font-bold text-amber-800 border border-amber-300">
                {isRescheduleRecipient ? "Reschedule Proposed" : "Reschedule Sent"}
              </span>
            ) : isExpired || isInitialExpired ? (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                Expired
              </span>
            ) : (
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${currentStatus.badge}`}>
                {currentStatus.text}
              </span>
            )}
          </div>

          <p className="mt-2 text-base text-slate-500">
            {descriptionText}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock3 size={18} className="text-violet-600" />
          <span>{session.duration} session</span>
        </div>
      </div>
    </section>
  );
};

export default SessionDetailsHeader;