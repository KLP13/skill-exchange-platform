import { CalendarDays, Clock3, CheckCircle2, XCircle, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSessions } from "@/hooks/useSessions";
import type { Session, SessionFilter } from "@/data/sessions";
import {
  getSessionStartDateTime,
  isSessionExpired,
  isInitialRequestExpired,
} from "@/utils/sessionTime";
import SessionCard from "./SessionCard";

type SessionListProps = {
  activeFilter?: SessionFilter;
};

// Helper: parse date to timestamp for sorting
const getSessionTimestamp = (session: Session): number => {
  const dt = getSessionStartDateTime(session.date, session.time);
  return dt ? dt.getTime() : 0;
};

const SessionList = ({ activeFilter = "all" }: SessionListProps) => {
  const navigate = useNavigate();
  const { sessions, currentUser, getPendingRescheduleForSession } = useSessions();

  const userSessions = sessions.filter((session) => {
    // For pending requests: show outgoing learner requests under My Sessions
    if (session.status === "pending") {
      return session.learnerId === currentUser.id;
    }
    // For upcoming, completed, cancelled, rejected: show if current user is learner or mentor
    return (
      session.learnerId === currentUser.id ||
      session.mentorId === currentUser.id
    );
  });

  // Filter sessions according to active tab
  let displayedSessions: Session[] = [];

  if (activeFilter === "upcoming") {
    // Active unexpired upcoming sessions + in-progress sessions + sessions with pending reschedule
    displayedSessions = userSessions
      .filter(
        (s) =>
          (s.status === "upcoming" &&
            (!isSessionExpired(s) || Boolean(getPendingRescheduleForSession(s.id)))) ||
          s.isStarted
      )
      .sort((a, b) => {
        if (a.isStarted && !b.isStarted) return -1;
        if (!a.isStarted && b.isStarted) return 1;
        return getSessionTimestamp(a) - getSessionTimestamp(b);
      });
  } else if (activeFilter === "pending") {
    // Active unexpired pending requests first
    displayedSessions = userSessions
      .filter((s) => s.status === "pending" && !isInitialRequestExpired(s))
      .sort((a, b) => getSessionTimestamp(b) - getSessionTimestamp(a));
  } else if (activeFilter === "completed") {
    // Completed History: newest completed first, SLICED TO LATEST 10
    displayedSessions = userSessions
      .filter((s) => s.status === "completed")
      .sort((a, b) => getSessionTimestamp(b) - getSessionTimestamp(a))
      .slice(0, 10);
  } else if (activeFilter === "cancelled") {
    // Cancelled, rejected, and expired sessions (both upcoming expired and initial request expired)
    displayedSessions = userSessions
      .filter(
        (s) =>
          s.status === "cancelled" ||
          s.status === "rejected" ||
          isSessionExpired(s) ||
          (s.status === "pending" && isInitialRequestExpired(s))
      )
      .sort((a, b) => getSessionTimestamp(b) - getSessionTimestamp(a));
  } else {
    // "all" tab: Active Upcoming/In-progress -> Active Pending -> Latest 10 Completed -> Cancelled/Expired
    const upcomingList = userSessions
      .filter((s) => (s.status === "upcoming" && !isSessionExpired(s)) || s.isStarted)
      .sort((a, b) => {
        if (a.isStarted && !b.isStarted) return -1;
        if (!a.isStarted && b.isStarted) return 1;
        return getSessionTimestamp(a) - getSessionTimestamp(b);
      });

    const pendingList = userSessions
      .filter((s) => s.status === "pending" && !isInitialRequestExpired(s))
      .sort((a, b) => getSessionTimestamp(b) - getSessionTimestamp(a));

    const completedList = userSessions
      .filter((s) => s.status === "completed")
      .sort((a, b) => getSessionTimestamp(b) - getSessionTimestamp(a))
      .slice(0, 10);

    const cancelledList = userSessions
      .filter(
        (s) =>
          s.status === "cancelled" ||
          s.status === "rejected" ||
          isSessionExpired(s) ||
          (s.status === "pending" && isInitialRequestExpired(s))
      )
      .sort((a, b) => getSessionTimestamp(b) - getSessionTimestamp(a));

    displayedSessions = [
      ...upcomingList,
      ...pendingList,
      ...completedList,
      ...cancelledList,
    ];
  }

  if (displayedSessions.length === 0) {
    let emptyIcon = <CalendarDays size={36} className="text-violet-600" />;
    let emptyTitle = "No sessions found";
    let emptyDesc = "You don't have any sessions matching the selected filter.";
    let actionLabel = "Explore Mentors";
    let actionRoute = "/explore";

    if (activeFilter === "upcoming") {
      emptyIcon = <Clock3 size={36} className="text-violet-600" />;
      emptyTitle = "No active upcoming sessions";
      emptyDesc = "You have no upcoming mentorship sessions scheduled at the moment.";
    } else if (activeFilter === "pending") {
      emptyIcon = <Inbox size={36} className="text-amber-600" />;
      emptyTitle = "No pending requests";
      emptyDesc = "You don't have any outgoing mentorship session requests waiting for acceptance.";
    } else if (activeFilter === "completed") {
      emptyIcon = <CheckCircle2 size={36} className="text-blue-600" />;
      emptyTitle = "No completed session history";
      emptyDesc = "Completed mentorship sessions and teaching history will appear here.";
    } else if (activeFilter === "cancelled") {
      emptyIcon = <XCircle size={36} className="text-red-500" />;
      emptyTitle = "No cancelled or expired sessions";
      emptyDesc = "You do not have any cancelled, declined, or expired sessions in history.";
    }

    return (
      <div className="rounded-3xl border border-violet-100 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
          {emptyIcon}
        </div>

        <h3 className="mt-5 text-xl font-bold text-[#211653]">
          {emptyTitle}
        </h3>

        <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto">
          {emptyDesc}
        </p>

        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate(actionRoute)}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 hover:shadow-md"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {displayedSessions.map((session) => (
        <SessionCard
          key={session.id}
          {...session}
        />
      ))}
    </section>
  );
};

export default SessionList;