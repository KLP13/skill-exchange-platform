import {
  CalendarDays,
  Clock3,
  Timer,
  Coins,
  BookOpen,
  Target,
} from "lucide-react";
import type { Session } from "@/data/sessions";
import UserAvatar from "@/components/ui/UserAvatar";

import { useSessions } from "@/hooks/useSessions";
import { formatSessionDuration } from "@/utils/sessionTime";

type SessionRoomInfoProps = {
  session: Session;
};

const SessionRoomInfo = ({ session }: SessionRoomInfoProps) => {
  const { currentUser, getUserById } = useSessions();
  const isMentor = currentUser.id === session.mentorId;
  const learnerObj = getUserById(session.learnerId);
  const mentorObj = getUserById(session.mentorId);
  const learnerDisplayName = session.learnerName || learnerObj?.name || "Student";
  const mentorDisplayName = session.mentor || mentorObj?.name || "Mentor";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Session Details */}
      <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-sm">
        <h2 className="text-lg font-semibold text-[#211653]">
          Session Overview
        </h2>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {/* Date */}
          <div className="rounded-xl bg-violet-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-violet-700">
              <CalendarDays size={15} />
              <span>Date</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-800">
              {session.date}
            </p>
          </div>

          {/* Time */}
          <div className="rounded-xl bg-violet-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-violet-700">
              <Clock3 size={15} />
              <span>Time</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-800">
              {session.time}
            </p>
          </div>

          {/* Duration */}
          <div className="rounded-xl bg-violet-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-violet-700">
              <Timer size={15} />
              <span>Duration</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-800">
              {formatSessionDuration(session)}
            </p>
          </div>

          {/* Credits */}
          <div className="rounded-xl bg-violet-50/60 p-3.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-violet-700">
              <Coins size={15} />
              <span>Cost</span>
            </div>
            <p className="mt-1.5 text-sm font-semibold text-slate-800">
              {session.credits || 5} Credits
            </p>
          </div>
        </div>

        {/* Topic Description */}
        <div className="mt-5 flex items-start gap-3 border-t border-slate-100 pt-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100">
            <BookOpen size={18} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Topic Description
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              {session.sessionDescription || session.learnerGoal || `Peer mentoring session on ${session.topic}`}
            </p>
          </div>
        </div>
      </section>

      {/* Participant & Learning Goal */}
      <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-sm">
        <h2 className="text-lg font-semibold text-[#211653]">
          {isMentor ? "Learner & Goal" : "Mentor & Goal"}
        </h2>

        {/* Counterpart summary */}
        <div className="mt-5 flex items-center gap-4 rounded-xl bg-violet-50/60 p-4">
          <UserAvatar
            avatar={isMentor ? learnerObj?.avatar : (session.mentorAvatar || mentorObj?.avatar)}
            name={isMentor ? learnerDisplayName : mentorDisplayName}
            sizeClassName="h-12 w-12"
            textClassName="text-base font-bold"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[#211653] truncate">
              {isMentor ? learnerDisplayName : mentorDisplayName}
            </h3>
            <p className="text-xs text-slate-500 truncate mt-0.5">
              {isMentor
                ? "Enrolled Learner · Peer Mentorship"
                : `${session.mentorRole || mentorObj?.role || "Mentor"} · Teaching: ${session.teachingSkill || session.topic || mentorObj?.teachingSkill || "Peer Mentorship"}`}
            </p>
          </div>
        </div>

        {/* Goal */}
        <div className="mt-5 flex items-start gap-3 border-t border-slate-100 pt-5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100">
            <Target size={18} className="text-violet-600" />
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              {isMentor ? "Learner's Goal" : "Your Learning Goal"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {session.learnerGoal}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SessionRoomInfo;
