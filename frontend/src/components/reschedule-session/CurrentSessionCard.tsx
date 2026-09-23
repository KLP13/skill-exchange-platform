import {
  CalendarDays,
  Clock3,
  Timer,
  Coins,
} from "lucide-react";
import type { Session } from "@/data/sessions";
import { useSessions } from "@/hooks/useSessions";
import UserAvatar from "@/components/ui/UserAvatar";

type CurrentSessionCardProps = {
  session: Session;
};

const CurrentSessionCard = ({ session }: CurrentSessionCardProps) => {
  const { currentUser, getUserById } = useSessions();
  const isMentor = currentUser.id === session.mentorId;
  const learnerObj = getUserById(session.learnerId);
  const mentorObj = getUserById(session.mentorId);

  const learnerName = session.learnerName || learnerObj?.name || "Student";
  const mentorName = session.mentor || mentorObj?.name || "Mentor";

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-7 shadow-sm">
      <h2 className="text-lg font-semibold text-[#211653]">
        Current Session Details
      </h2>

      {/* Topic and Counterpart */}
      <div className="mt-5 flex items-start gap-4 rounded-xl bg-violet-50/70 p-4">
        <UserAvatar
          avatar={isMentor ? learnerObj?.avatar : (session.mentorAvatar || mentorObj?.avatar)}
          name={isMentor ? learnerName : mentorName}
          sizeClassName="h-11 w-11"
          textClassName="text-base font-bold"
        />
        <div>
          <h3 className="font-semibold text-[#211653]">{session.topic}</h3>
          <p className="text-sm text-slate-600">
            {isMentor ? (
              <>
                Learner: <span className="font-medium text-slate-800">{learnerName}</span>
              </>
            ) : (
              <>
                Mentor: <span className="font-medium text-slate-800">{mentorName}</span> · {session.mentorRole}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Grid of current timing & info */}
      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <CalendarDays size={14} className="text-violet-600" />
            <span>Current Date</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {session.date}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Clock3 size={14} className="text-violet-600" />
            <span>Current Time</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {session.time}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Timer size={14} className="text-violet-600" />
            <span>Duration</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {session.duration}
          </p>
        </div>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <Coins size={14} className="text-violet-600" />
            <span>Credits</span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            {session.credits} Credits
          </p>
        </div>
      </div>
    </section>
  );
};

export default CurrentSessionCard;
