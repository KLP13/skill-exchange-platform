import {
  CalendarDays,
  Clock3,
  Timer,
  User,
  BookOpen,
} from "lucide-react";
import type { Session } from "@/data/sessions";
import UserAvatar from "@/components/ui/UserAvatar";

type ReviewSessionSummaryProps = {
  session: Session;
};

const ReviewSessionSummary = ({ session }: ReviewSessionSummaryProps) => {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-sm">
      <h2 className="text-lg font-semibold text-[#211653]">
        Session Summary
      </h2>

      {/* Mentor and Topic Hero */}
      <div className="mt-5 flex items-start gap-4 rounded-xl bg-violet-50/70 p-4">
        <UserAvatar
          avatar={session.mentorAvatar}
          name={session.mentor}
          sizeClassName="h-12 w-12"
          textClassName="text-base font-bold"
        />
        <div>
          <h3 className="font-semibold text-[#211653]">{session.topic}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Mentor: <span className="font-medium text-slate-700">{session.mentor}</span> · {session.mentorRole}
          </p>
        </div>
      </div>

      {/* Grid of session metadata */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {/* Mentor */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <User size={14} className="text-violet-600" />
            <span>Mentor</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {session.mentor}
          </p>
        </div>

        {/* Topic */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <BookOpen size={14} className="text-violet-600" />
            <span>Topic</span>
          </div>
          <p className="mt-1.5 truncate text-sm font-semibold text-slate-800" title={session.topic}>
            {session.topic}
          </p>
        </div>

        {/* Date & Time */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <CalendarDays size={14} className="text-violet-600" />
            <span>Date & Time</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {session.date}
          </p>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock3 size={12} className="text-slate-400" />
            <span>{session.time}</span>
          </div>
        </div>

        {/* Duration */}
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Timer size={14} className="text-violet-600" />
            <span>Duration</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {session.duration}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ReviewSessionSummary;
