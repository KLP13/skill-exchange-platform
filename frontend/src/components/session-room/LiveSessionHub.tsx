import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  ExternalLink,
  Copy,
  Check,
  Clock,
  Sparkles,
  ShieldCheck,
  FileText,
  PhoneOff,
  LogOut,
  Maximize2,
  Users,
  Share2,
  CheckCircle2,
} from "lucide-react";
import type { Session } from "@/data/sessions";
import type { User } from "@/data/mentors";
import { useSessions } from "@/hooks/useSessions";
import { formatSessionDuration } from "@/utils/sessionTime";
import UserAvatar from "@/components/ui/UserAvatar";
import JitsiVideoCall from "./JitsiVideoCall";

interface LiveSessionHubProps {
  session: Session;
  currentUser: User;
  isMentor: boolean;
  onEndSession: () => void;
  onLeaveRoom: () => void;
}

export const LiveSessionHub: React.FC<LiveSessionHubProps> = ({
  session,
  currentUser,
  isMentor,
  onEndSession,
  onLeaveRoom,
}) => {
  const navigate = useNavigate();
  const { refreshSessions } = useSessions();
  const [viewMode, setViewMode] = useState<"tab" | "embedded">("tab");
  const [copied, setCopied] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);

  // Real-time automatic redirect for learner when mentor ends the session
  useEffect(() => {
    if (session.status === "completed") {
      navigate(`/session-details/${session.id}`, { replace: true });
    }
  }, [session.status, session.id, navigate]);

  // Live polling during call so status updates automatically across different browsers/devices
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSessions();
    }, 2000);
    return () => clearInterval(interval);
  }, [refreshSessions]);
  const [notes, setNotes] = useState(() => {
    try {
      return localStorage.getItem(`skillswap_notes_${session.id}`) || "";
    } catch {
      return "";
    }
  });
  const [savedNotesNotice, setSavedNotesNotice] = useState(false);

  // Generate safe Jitsi meeting room URL with pre-join disabled and user pre-configured
  const cleanTopic = (session.topic || "Session").replace(/[^a-zA-Z0-9]/g, "").slice(0, 16);
  const cleanId = session.id.replace(/[^a-zA-Z0-9]/g, "");
  const roomName = `SkillSwap-${cleanId}-${cleanTopic}`;
  const displayName = encodeURIComponent(currentUser.name || (isMentor ? "Mentor" : "Student"));
  const meetingUrl = `https://meet.jit.si/${roomName}#userInfo.displayName=${displayName}&config.prejoinConfig.enabled=false&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  // Auto-launch meeting tab on mount once
  const hasAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (!hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      try {
        window.open(meetingUrl, "_blank");
      } catch {
        // Pop-up blocker fallback handled gracefully by UI button
      }
    }
  }, [meetingUrl]);

  // Elapsed meeting timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    const startTime = session.startedAt ? new Date(session.startedAt).getTime() : Date.now();
    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((now - startTime) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session.startedAt]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
    }
  };

  const handleOpenMeetingTab = () => {
    window.open(meetingUrl, "_blank");
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    try {
      localStorage.setItem(`skillswap_notes_${session.id}`, val);
      setSavedNotesNotice(true);
      setTimeout(() => setSavedNotesNotice(false), 1500);
    } catch {}
  };

  // If user explicitly chooses embedded in-app mode
  if (viewMode === "embedded") {
    return (
      <div className="flex flex-col h-full w-full bg-slate-950 text-white">
        {/* Sub-bar to return to Tab Mode */}
        <div className="flex items-center justify-between bg-slate-900 border-b border-white/10 px-6 py-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span>In-App View (Subject to 5-min demo limit). For unlimited time:</span>
          </div>
          <button
            type="button"
            onClick={() => setViewMode("tab")}
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1 font-semibold text-white hover:bg-violet-500 transition"
          >
            <ExternalLink size={13} />
            Switch to Dedicated Tab (Unlimited)
          </button>
        </div>

        <div className="flex-1 w-full min-h-0">
          <JitsiVideoCall
            session={session}
            currentUser={currentUser}
            isMentor={isMentor}
            onEndSession={onEndSession}
            onLeaveRoom={onLeaveRoom}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-950 text-slate-100 antialiased selection:bg-violet-500 selection:text-white">
      {/* Top Professional Meeting Header */}
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-slate-900/90 px-6 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 shadow-md shadow-violet-500/20">
            <Video size={20} className="text-white" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white sm:text-base tracking-tight">
                {session.topic || "Mentoring Session"}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Call Active
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isMentor ? `Mentoring: ${session.learnerName || "Learner"}` : `Mentor: ${session.mentor}`} · {formatSessionDuration(session)}
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-3">
          {/* Live Call Timer */}
          <div className="flex items-center gap-2 rounded-xl bg-slate-800/80 border border-white/10 px-3.5 py-2 text-xs font-mono font-bold text-violet-300">
            <Clock size={14} className="text-violet-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>

          {/* Open Video Call Button */}
          <button
            type="button"
            onClick={handleOpenMeetingTab}
            className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500 hover:scale-105 active:scale-95"
            title="Open meeting in dedicated tab"
          >
            <ExternalLink size={15} />
            <span>Open Video Tab</span>
          </button>

          {/* End / Leave Actions */}
          {isMentor ? (
            <button
              type="button"
              onClick={() => setShowEndModal(true)}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-red-600/20 transition hover:bg-red-500 hover:scale-105 active:scale-95"
              title="End session and award +10 credits"
            >
              <PhoneOff size={15} />
              <span className="hidden sm:inline">End & Settle</span>
              <span className="sm:hidden">End</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLeaveRoom}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-300 transition hover:bg-white/15"
              title="Leave Room"
            >
              <LogOut size={15} />
              <span>Leave Room</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Companion Hub Layout */}
      <main className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Primary Video Call Control Center (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {/* Main Hero Call Launcher Card */}
          <div className="relative overflow-hidden rounded-3xl border border-violet-500/25 bg-gradient-to-b from-slate-900 to-slate-950 p-7 sm:p-8 shadow-2xl">
            {/* Background ambient glow */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="flex h-3.5 w-3.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Meeting in Session
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <ShieldCheck size={14} className="text-emerald-400" />
                <span>WebRTC Encrypted</span>
              </div>
            </div>

            <div className="mt-7 text-center">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {session.topic}
              </h2>
              <p className="mt-2 text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
                The call is open in your dedicated meeting tab with full Zoom-style gallery view, screen sharing, virtual backgrounds, and no 5-minute limit.
              </p>

              {/* Big Prominent Action Button */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <button
                  type="button"
                  onClick={handleOpenMeetingTab}
                  className="cursor-pointer w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-violet-600/30 transition hover:from-violet-500 hover:to-indigo-500 hover:scale-105 active:scale-95"
                >
                  <Video size={20} />
                  <span>Open Video Meeting Tab</span>
                  <ExternalLink size={16} className="opacity-80" />
                </button>

                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="cursor-pointer w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10 active:scale-95"
                  title="Copy meeting link"
                >
                  {copied ? (
                    <>
                      <Check size={17} className="text-emerald-400" />
                      <span className="text-emerald-300 font-bold">Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={17} />
                      <span>Copy Call Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Feature Pills */}
              <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-300">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 border border-white/5">
                  <Sparkles size={13} className="text-violet-400" />
                  Unlimited Call Time
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 border border-white/5">
                  <Share2 size={13} className="text-indigo-400" />
                  HD Screen Share & Audio
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 px-3 py-1.5 border border-white/5">
                  <FileText size={13} className="text-emerald-400" />
                  Built-in Whiteboard
                </span>
              </div>
            </div>

            {/* View Switcher Footer */}
            <div className="mt-7 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
              <span>Want to watch the video inside this window instead?</span>
              <button
                type="button"
                onClick={() => setViewMode("embedded")}
                className="cursor-pointer inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 font-semibold underline"
              >
                <Maximize2 size={12} />
                Switch to In-App View
              </button>
            </div>
          </div>

          {/* Participants Card */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Users size={15} className="text-violet-400" />
              Session Participants
            </h3>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mentor Card */}
              <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 p-4 border border-white/5">
                <UserAvatar
                  avatar={session.mentorAvatar}
                  name={session.mentor || "Mentor"}
                  sizeClassName="h-12 w-12"
                  textClassName="text-base font-bold"
                />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">
                    Mentor
                  </span>
                  <h4 className="mt-1 text-sm font-bold text-white">
                    {session.mentor || "Peer Mentor"}
                  </h4>
                  <p className="text-xs text-slate-400">Teaching: {session.teachingSkill || "Topic"}</p>
                </div>
              </div>

              {/* Learner Card */}
              <div className="flex items-center gap-3.5 rounded-2xl bg-white/5 p-4 border border-white/5">
                <UserAvatar
                  avatar={(session as any).learnerAvatar || (session as any).learnerAvatarUrl}
                  name={session.learnerName || "Learner"}
                  sizeClassName="h-12 w-12"
                  textClassName="text-base font-bold"
                />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    Learner
                  </span>
                  <h4 className="mt-1 text-sm font-bold text-white">
                    {session.learnerName || "Student"}
                  </h4>
                  <p className="text-xs text-slate-400">{session.learnerGoal || "Skill Exchange"}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Live Scratchpad & Settlement Controls (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          {/* In-Session Scratchpad */}
          <div className="flex flex-col flex-1 rounded-3xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-violet-400" />
                <h3 className="text-sm font-bold text-white">Session Scratchpad</h3>
              </div>
              {savedNotesNotice ? (
                <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                  <Check size={12} /> Auto-saved
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">Auto-saved locally</span>
              )}
            </div>

            <p className="mt-2 text-xs text-slate-400">
              Take live notes, copy code snippets, or drop links during the mentoring session:
            </p>

            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Jot down notes, commands, key ideas, or links here..."
              rows={9}
              className="mt-3 w-full flex-1 rounded-2xl border border-white/10 bg-slate-950 p-4 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 font-mono resize-none"
            />
          </div>

          {/* Credit Settlement Card for Mentor */}
          {isMentor ? (
            <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-slate-900 p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Mentor Reward
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                  +10 Credits
                </span>
              </div>

              <h4 className="mt-2 text-base font-bold text-white">
                Ready to conclude your session?
              </h4>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                When you finish teaching, click below to end the session. +10 credits will be instantly awarded to your wallet, and your student will be prompted to leave a review.
              </p>

              <button
                type="button"
                onClick={() => setShowEndModal(true)}
                className="cursor-pointer mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-emerald-500 active:scale-95"
              >
                <CheckCircle2 size={17} />
                <span>End Session & Settle Credits (+10)</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-violet-400">
                  Learner Exchange
                </span>
                <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-bold text-violet-300">
                  5 Credits Deducted
                </span>
              </div>

              <h4 className="mt-2 text-base font-bold text-white">
                Learning in Progress
              </h4>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                Your mentor will end the session once the lesson wraps up. You will then be able to rate your mentor and download any shared notes.
              </p>

              <button
                type="button"
                onClick={onLeaveRoom}
                className="cursor-pointer mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10"
              >
                <LogOut size={15} />
                <span>Leave Session Room</span>
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Confirmation Modal to End Session */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/15 bg-slate-900 p-6 shadow-2xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
              <CheckCircle2 size={30} />
            </div>

            <h3 className="mt-4 text-xl font-bold text-white">
              End Session & Settle Credits?
            </h3>
            <p className="mt-2 text-xs text-slate-300 leading-relaxed">
              This will officially conclude your mentoring session on{" "}
              <strong className="text-white">"{session.topic}"</strong>.
            </p>

            <div className="mt-4 rounded-2xl bg-white/5 border border-white/10 p-3.5 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Mentor reward:</span>
                <span className="font-bold text-emerald-400">+10 Credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Learner deduction:</span>
                <span className="font-bold text-violet-300">-5 Credits</span>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="cursor-pointer flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10 transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowEndModal(false);
                  onEndSession();
                }}
                className="cursor-pointer flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-lg"
              >
                Confirm & Settle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSessionHub;
