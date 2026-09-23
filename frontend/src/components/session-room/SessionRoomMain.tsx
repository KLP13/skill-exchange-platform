import { useState, useEffect } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Play,
  Loader2,
  LogOut,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSessions } from "@/hooks/useSessions";
import type { Session } from "@/data/sessions";
import { isSessionBeforeStart, formatStartTimeOnly, formatSessionDuration } from "@/utils/sessionTime";
import LiveSessionHub from "./LiveSessionHub";
import UserAvatar from "@/components/ui/UserAvatar";

type SessionRoomMainProps = {
  session: Session;
};

const SessionRoomMain = ({ session }: SessionRoomMainProps) => {
  const navigate = useNavigate();
  const { currentUser, startSession, endSession, getUserById, refreshSessions } = useSessions();
  const [isMicOn, setIsMicOn] = useState(true);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const isMentor = currentUser.id === session.mentorId;
  const isStarted = session.status === "in_progress" || !!session.isStarted;
  const isBeforeStart = isSessionBeforeStart(session.date, session.time);
  const startTimeOnly = formatStartTimeOnly(session.time);

  // Real-time polling so transitions (start / end) reflect immediately
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSessions();
    }, 2000);
    return () => clearInterval(interval);
  }, [refreshSessions]);

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await refreshSessions();
    } finally {
      setTimeout(() => setIsChecking(false), 500);
    }
  };

  const learnerObj = getUserById(session.learnerId);
  const mentorObj = getUserById(session.mentorId);
  const learnerDisplayName = session.learnerName || learnerObj?.name || "Student Learner";
  const mentorDisplayName = session.mentor || mentorObj?.name || "Mentor";

  const handleStartSession = () => {
    if (isBeforeStart) {
      alert(`Cannot start session before scheduled start time (${startTimeOnly}).`);
      return;
    }
    const res = startSession(session.id);
    if (!res.success && res.error) {
      alert(res.error);
    }
  };

  const handleEndSession = () => {
    const res = endSession(session.id);
    if (res.success) {
      navigate(`/session-details/${session.id}`);
    } else if (res.error) {
      alert(res.error);
    }
  };

  const handleLeaveRoom = () => {
    navigate(`/session-details/${session.id}`);
  };

  // -------------------------------------------------------------
  // STATE 1: WAITING ROOM / MENTOR START CONTROL (session not started yet)
  // -------------------------------------------------------------
  if (!isStarted) {
    if (isMentor) {
      // MENTOR VIEW: Mentor Start Control
      return (
        <section className="overflow-hidden rounded-3xl border border-violet-100 bg-slate-950 shadow-xl">
          <div className="relative flex min-h-[440px] flex-col items-center justify-center p-8 text-center sm:min-h-[500px]">
            {/* Status indicator */}
            <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-amber-500/20 px-4 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-md">
              <span className={`h-2 w-2 rounded-full ${isBeforeStart ? "bg-amber-400" : "bg-emerald-400 animate-ping"}`} />
              {isBeforeStart ? `Scheduled for ${startTimeOnly}` : "Ready to Start Session"}
            </div>

            {/* Center: Mentor Lobby / Start Session Card */}
            <div className="flex max-w-md flex-col items-center">
              <div className="relative">
                <UserAvatar
                  avatar={session.mentorAvatar || mentorObj?.avatar}
                  name={mentorDisplayName}
                  sizeClassName="h-24 w-24 sm:h-28 sm:w-28"
                  textClassName="text-3xl font-bold"
                  className="shadow-xl ring-8 ring-violet-500/20"
                />
              </div>

              <h2 className="mt-5 text-2xl font-bold text-white">
                {isBeforeStart
                  ? `Session with ${learnerDisplayName}`
                  : `Ready to mentor ${learnerDisplayName}?`}
              </h2>

              <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                Topic: <span className="font-semibold text-violet-300">{session.topic}</span>
              </p>

              <p className="mt-2 text-xs text-slate-400 max-w-sm">
                {isBeforeStart
                  ? `Scheduled start time: ${session.date} at ${startTimeOnly}. As the mentor, you will be able to start the session once the scheduled time arrives.`
                  : "Scheduled time has arrived. When you're ready, click Start Session to begin teaching and connect with the learner."}
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-4">
                {isBeforeStart ? (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed inline-flex items-center gap-2.5 rounded-2xl bg-slate-800 border border-slate-700 px-8 py-4 text-sm font-bold text-slate-400 shadow-none opacity-80"
                    title={`Start Session will be available at ${startTimeOnly}`}
                  >
                    <Play size={18} className="fill-slate-500 text-slate-500" />
                    Start Session (Available at {startTimeOnly})
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartSession}
                    className="cursor-pointer inline-flex items-center gap-2.5 rounded-2xl bg-emerald-600 px-8 py-4 text-base font-bold text-white shadow-xl transition-all duration-200 hover:bg-emerald-500 hover:scale-105 active:scale-95"
                  >
                    <Play size={20} className="fill-white" />
                    Start Session
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Controls Bar for Mentor */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-slate-900/90 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">Role: Mentor</span>
              <span>·</span>
              <span>Test Audio & Video before starting</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMicOn((prev) => !prev)}
                className={`cursor-pointer flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                  isMicOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500 text-white"
                }`}
                title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              <button
                type="button"
                onClick={() => setIsVideoOn((prev) => !prev)}
                className={`cursor-pointer flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                  isVideoOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500 text-white"
                }`}
                title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
              >
                {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              {!isBeforeStart && (
                <button
                  type="button"
                  onClick={handleStartSession}
                  className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  <Play size={16} className="fill-white" />
                  Start Session
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLeaveRoom}
                className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
              >
                <LogOut size={14} />
                Exit Room
              </button>
            </div>
          </div>
        </section>
      );
    }

    // LEARNER VIEW: WAITING ROOM
    return (
      <section className="overflow-hidden rounded-3xl border border-violet-100 bg-slate-950 shadow-xl">
        <div className="relative flex min-h-[440px] flex-col items-center justify-center p-8 text-center sm:min-h-[500px]">
          {/* Status indicator */}
          <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-violet-500/20 px-4 py-1.5 text-xs font-semibold text-violet-300 backdrop-blur-md">
            <Loader2 size={14} className="animate-spin text-violet-400" />
            Waiting Room
          </div>

          {/* Center: Waiting on Mentor Animation */}
          <div className="flex max-w-lg flex-col items-center">
            <div className="relative">
              <UserAvatar
                avatar={session.mentorAvatar || mentorObj?.avatar}
                name={mentorDisplayName}
                sizeClassName="h-24 w-24 sm:h-28 sm:w-28"
                textClassName="text-3xl font-bold"
                className="shadow-xl ring-8 ring-violet-500/20"
              />
              <span className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-slate-950">
                <Loader2 size={16} className="animate-spin text-white" />
              </span>
            </div>

            <h2 className="mt-6 text-2xl font-bold text-white">
              You are in the waiting room.
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Your mentor can start the session at the scheduled time.
            </p>

            {/* Session Info Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3 w-full text-left text-xs bg-white/5 p-4 rounded-2xl border border-white/10">
              <div>
                <span className="text-slate-400 font-medium">Topic:</span>
                <p className="font-semibold text-white truncate mt-0.5">{session.topic}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Mentor:</span>
                <p className="font-semibold text-white truncate mt-0.5">{mentorDisplayName}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Scheduled Date:</span>
                <p className="font-semibold text-white mt-0.5">{session.date}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Scheduled Time:</span>
                <p className="font-semibold text-white mt-0.5">{session.time}</p>
              </div>
              <div className="col-span-2 border-t border-white/10 pt-2 mt-1 flex justify-between">
                <span className="text-slate-400 font-medium">Duration:</span>
                <p className="font-semibold text-violet-300">{formatSessionDuration(session)}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-5 py-2.5 text-xs text-slate-300">
              <Sparkles size={16} className="text-violet-400" />
              <span>You're in queue. As soon as {mentorDisplayName} clicks Start Session, you will enter automatically.</span>
            </div>

            {/* Live Polling Status & Manual Check Button */}
            <div className="mt-5 flex items-center justify-center">
              <button
                type="button"
                onClick={handleManualCheck}
                disabled={isChecking}
                className="cursor-pointer inline-flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-600/20 px-4 py-2 text-xs font-semibold text-violet-200 shadow-md transition hover:bg-violet-600/40 hover:text-white active:scale-95 disabled:opacity-75"
                title="Check if mentor started the session"
              >
                <RefreshCw size={13} className={isChecking ? "animate-spin" : ""} />
                <span>{isChecking ? "Checking Status..." : "Refresh / Check Now"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Controls Bar for Learner */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 bg-slate-900/90 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">Role: Learner</span>
            <span>·</span>
            <span>Cost: 5 Credits (deducted after session ends)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMicOn((prev) => !prev)}
              className={`cursor-pointer flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                isMicOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500 text-white"
              }`}
              title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}
            >
              {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>

            <button
              type="button"
              onClick={() => setIsVideoOn((prev) => !prev)}
              className={`cursor-pointer flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                isVideoOn ? "bg-white/10 text-white hover:bg-white/20" : "bg-red-500 text-white"
              }`}
              title={isVideoOn ? "Turn Camera Off" : "Turn Camera On"}
            >
              {isVideoOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLeaveRoom}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:bg-white/10"
            >
              <LogOut size={14} />
              Leave Waiting Room
            </button>
          </div>
        </div>
      </section>
    );
  }

  // -------------------------------------------------------------
  // STATE 2: ACTIVE SESSION IN PROGRESS (LIVE ZOOM-GRADE WEBRTC CALL)
  // -------------------------------------------------------------
  return (
    <LiveSessionHub
      session={session}
      currentUser={currentUser}
      isMentor={isMentor}
      onEndSession={handleEndSession}
      onLeaveRoom={handleLeaveRoom}
    />
  );
};

export default SessionRoomMain;
