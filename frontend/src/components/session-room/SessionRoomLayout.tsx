import { ArrowLeft, Clock, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Session } from "@/data/sessions";
import { useSessions } from "@/hooks/useSessions";
import { checkSessionAccess } from "@/utils/sessionTime";

import Sidebar from "../dashboard/Sidebar";
import Topbar from "../dashboard/Topbar";

import SessionRoomHeader from "./SessionRoomHeader";
import SessionRoomMain from "./SessionRoomMain";
import SessionRoomInfo from "./SessionRoomInfo";

type SessionRoomLayoutProps = {
  session: Session | undefined;
};

const SessionRoomLayout = ({ session }: SessionRoomLayoutProps) => {
  const navigate = useNavigate();
  const { currentUser } = useSessions();

  const access = checkSessionAccess(session, currentUser);

  if (!access.allowed || !session) {
    let icon = <AlertCircle size={36} className="text-violet-600" />;
    let iconBg = "bg-violet-100";

    if (access.status === "BEFORE_START") {
      icon = <Clock size={36} className="text-amber-600" />;
      iconBg = "bg-amber-100";
    } else if (access.status === "NOT_PARTICIPANT") {
      icon = <ShieldAlert size={36} className="text-red-600" />;
      iconBg = "bg-red-100";
    } else if (access.status === "COMPLETED") {
      icon = <CheckCircle2 size={36} className="text-blue-600" />;
      iconBg = "bg-blue-100";
    }

    return (
      <div className="flex min-h-screen bg-[#f8f7fc]">
        <Sidebar />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            <Topbar />

            <div className="mx-auto mt-16 max-w-lg text-center">
              <div className="rounded-3xl border border-violet-100 bg-white p-10 shadow-sm">
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${iconBg}`}>
                  {icon}
                </div>

                <h2 className="mt-5 text-2xl font-bold text-[#211653]">
                  {access.title}
                </h2>

                <p className="mt-3 text-sm leading-relaxed text-slate-500">
                  {access.message}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  {session && (session.learnerId === currentUser.id || session.mentorId === currentUser.id) && (
                    <button
                      type="button"
                      onClick={() => navigate(`/session-details/${session.id}`)}
                      className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white px-5 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                    >
                      Session Details
                    </button>
                  )}

                  {access.status === "COMPLETED" && session && (
                    <button
                      type="button"
                      onClick={() => navigate(`/session-notes/${session.id}`)}
                      className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 hover:shadow-md"
                    >
                      View Notes
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate("/my-sessions")}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 hover:shadow-md"
                  >
                    <ArrowLeft size={18} />
                    Back to My Sessions
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isStarted = session?.status === "in_progress" || !!session?.isStarted;

  // Active Call: 100% Immersive Full-Screen Focus (No sidebar or topbar distractions)
  if (isStarted) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col h-screen w-screen bg-slate-950 overflow-y-auto">
        <SessionRoomMain session={session} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f7fc]">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          <Topbar />

          <div className="mx-auto mt-8 max-w-6xl space-y-7">
            <SessionRoomHeader session={session} />

            <SessionRoomMain session={session} />

            <SessionRoomInfo session={session} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SessionRoomLayout;
