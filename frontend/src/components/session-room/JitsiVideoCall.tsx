import React, { useRef } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { PhoneOff, LogOut, Sparkles, ShieldCheck, ExternalLink, Info } from "lucide-react";
import type { Session } from "@/data/sessions";
import type { User } from "@/data/mentors";

interface JitsiVideoCallProps {
  session: Session;
  currentUser: User;
  isMentor: boolean;
  onEndSession: () => void;
  onLeaveRoom: () => void;
}

export const JitsiVideoCall: React.FC<JitsiVideoCallProps> = ({
  session,
  currentUser,
  isMentor,
  onEndSession,
  onLeaveRoom,
}) => {
  const apiRef = useRef<any>(null);

  // Generate a clean, unique, and safe room name tied to the session
  const cleanTopic = (session.topic || "Session")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 16);
  const cleanId = session.id.replace(/[^a-zA-Z0-9]/g, "");
  const roomName = `SkillSwap-${cleanId}-${cleanTopic}`;
  const displayName = encodeURIComponent(currentUser.name || (isMentor ? "Mentor" : "Student"));
  const meetingUrl = `https://meet.jit.si/${roomName}#userInfo.displayName=${displayName}&config.prejoinConfig.enabled=false&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false`;

  const handleApiReady = (externalApi: any) => {
    apiRef.current = externalApi;

    // Listen for conference join
    externalApi.addListener("videoConferenceJoined", () => {
      console.log("Joined Jitsi conference:", roomName);
    });

    // Listen for hangup inside Jitsi frame
    externalApi.addListener("readyToClose", () => {
      if (isMentor) {
        onEndSession();
      } else {
        onLeaveRoom();
      }
    });
  };

  return (
    <div className="flex flex-col h-full w-full min-h-screen overflow-hidden bg-slate-950">
      {/* Top Session Call Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-slate-900/90 px-6 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white sm:text-base">
                {session.topic || "Peer Mentoring Session"}
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">
                <Sparkles size={11} />
                Live WebRTC
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isMentor ? `Mentoring: ${session.learnerName || "Learner"}` : `Mentor: ${session.mentor}`} · {session.duration}
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2.5">
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-violet-500/40 bg-violet-600/30 px-3 py-2 text-xs sm:text-sm font-semibold text-violet-200 transition hover:bg-violet-600/50 hover:text-white"
            title="Open meeting directly in a new tab without the 5-minute iframe demo limit"
          >
            <ExternalLink size={15} />
            <span className="hidden sm:inline">Open in Tab (Unlimited)</span>
            <span className="sm:hidden">Open Tab</span>
          </a>

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Encrypted Room</span>
          </div>

          {isMentor ? (
            <button
              type="button"
              onClick={onEndSession}
              className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg transition-all duration-200 hover:bg-red-500 hover:scale-105 active:scale-95"
              title="End session and award +10 credits"
            >
              <PhoneOff size={16} />
              <span>End & Settle Credits</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onLeaveRoom}
              className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-200 transition hover:bg-white/20"
              title="Leave Room"
            >
              <LogOut size={15} />
              <span>Leave Call</span>
            </button>
          )}
        </div>
      </div>

      {/* Embedded 5-Min Notice Banner */}
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 bg-amber-950/40 px-6 py-2 text-xs text-amber-200">
        <div className="flex items-center gap-2">
          <Info size={14} className="text-amber-400 shrink-0" />
          <span>
            Jitsi restricts <strong>embedded iframes</strong> on <code className="text-amber-300">meet.jit.si</code> to a 5-minute demo. For unlimited session time, click{" "}
            <a
              href={meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline hover:text-white"
            >
              Open in Tab
            </a>.
          </span>
        </div>
        <a
          href={meetingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 underline hover:text-white shrink-0"
        >
          Open Unlimited Meeting <ExternalLink size={12} />
        </a>
      </div>

      {/* Jitsi Meet Container */}
      <div className="relative flex-1 min-h-[500px] w-full bg-black">
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
            hideConferenceSubject: false,
            subject: session.topic || "SkillSwap Mentoring",
            toolbarButtons: [
              "camera",
              "chat",
              "desktop",
              "fodeviceselection",
              "fullscreen",
              "hangup",
              "microphone",
              "participants-pane",
              "profile",
              "raisehand",
              "select-background",
              "settings",
              "tileview",
              "videoquality",
            ],
          }}
          interfaceConfigOverwrite={{
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            DEFAULT_REMOTE_DISPLAY_NAME: isMentor ? "Learner" : "Mentor",
            TOOLBAR_ALWAYS_VISIBLE: true,
          }}
          userInfo={{
            displayName: currentUser.name || (isMentor ? "Mentor" : "Student"),
            email: currentUser.email || "",
          }}
          onApiReady={handleApiReady}
          onReadyToClose={() => {
            if (isMentor) {
              onEndSession();
            } else {
              onLeaveRoom();
            }
          }}
          getIFrameRef={(iframeRef) => {
            if (iframeRef) {
              iframeRef.style.height = "100%";
              iframeRef.style.width = "100%";
              iframeRef.style.border = "none";
            }
          }}
        />
      </div>

      {/* Bottom Guidance Bar */}
      <div className="flex items-center justify-between border-t border-white/10 bg-slate-900/90 px-6 py-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Camera, microphone, and screen share are active.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-violet-400 font-medium">Session Room: {session.id}</span>
        </div>
      </div>
    </div>
  );
};

export default JitsiVideoCall;
