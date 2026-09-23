import { useState } from "react";
import { Calendar, Clock, CheckCircle2, XCircle, ArrowRight, Sparkles, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSessions } from "@/hooks/useSessions";
import { useChat } from "@/hooks/useChat";
import NegotiateTimingModal from "./NegotiateTimingModal";

export interface SessionRequestPayload {
  type: "SESSION_REQUEST";
  sessionId: string;
  topic: string;
  date: string;
  rawDate?: string;
  time: string;
  rawTime?: string;
  duration?: string;
  status?: string;
  learnerGoal?: string;
  learnerName?: string;
  mentorName?: string;
}

type SessionRequestCardProps = {
  payload: SessionRequestPayload;
  conversationId: string;
  isMe: boolean;
};

export default function SessionRequestCard({
  payload,
  conversationId,
  isMe,
}: SessionRequestCardProps) {
  const navigate = useNavigate();
  const { currentUser, sessions, acceptRequest, rejectRequest } = useSessions();
  const { sendMessage } = useChat();

  const [isNegotiateOpen, setIsNegotiateOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Live session record if synced
  const liveSession = sessions.find((s) => s.id === payload.sessionId);
  const currentStatus = liveSession?.status || payload.status || "pending";
  const currentDate = liveSession?.date || payload.date;
  const currentTime = liveSession?.time || payload.time;

  const isMentor = liveSession
    ? liveSession.mentorId === currentUser.id
    : !isMe;

  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      acceptRequest(payload.sessionId);
      sendMessage(
        conversationId,
        `✅ I have accepted the session request for **${payload.topic}** on **${currentDate}** at **${currentTime}**! Looking forward to our session.`
      );
    } catch (err) {
      console.error("Error accepting session request:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      rejectRequest(payload.sessionId);
      sendMessage(
        conversationId,
        `❌ Session request for **${payload.topic}** was declined.`
      );
    } catch (err) {
      console.error("Error declining session request:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="my-2 w-full max-w-md rounded-3xl border border-violet-200/90 bg-white p-5 shadow-sm transition hover:shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <BookOpen size={18} />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-700">
                Session Request
              </span>
              <h4 className="text-sm font-bold text-slate-900 leading-tight">
                {payload.topic}
              </h4>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              currentStatus === "completed"
                ? "bg-emerald-100 text-emerald-800"
                : currentStatus === "in_progress"
                ? "bg-emerald-100 text-emerald-700"
                : currentStatus === "upcoming"
                ? "bg-green-100 text-green-700"
                : currentStatus === "rejected" || currentStatus === "cancelled"
                ? "bg-red-100 text-red-700"
                : currentStatus === "negotiating"
                ? "bg-violet-100 text-violet-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {currentStatus === "completed"
              ? "Completed"
              : currentStatus === "in_progress"
              ? "In Progress"
              : currentStatus === "upcoming"
              ? "Accepted"
              : currentStatus === "negotiating"
              ? "Negotiating"
              : currentStatus === "rejected"
              ? "Declined"
              : "Pending"}
          </span>
        </div>

        {/* Schedule & Duration details */}
        <div className="mt-3.5 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-violet-600 shrink-0" />
            <span className="font-semibold text-slate-800">Date:</span>
            <span>{currentDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={15} className="text-violet-600 shrink-0" />
            <span className="font-semibold text-slate-800">Time:</span>
            <span>{currentTime}</span>
            {payload.duration && (
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                {payload.duration}
              </span>
            )}
          </div>

          {payload.learnerGoal && (
            <div className="mt-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-700">Goal: </span>
              {payload.learnerGoal}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          {currentStatus === "completed" ? (
            <button
              type="button"
              onClick={() => navigate(`/session-details/${payload.sessionId}`)}
              className="cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
            >
              Session Completed · View Details <ArrowRight size={14} />
            </button>
          ) : currentStatus === "in_progress" ? (
            <button
              type="button"
              onClick={() => navigate(`/session-room/${payload.sessionId}`)}
              className="cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm transition"
            >
              Enter Active Video Call <ArrowRight size={14} />
            </button>
          ) : currentStatus === "upcoming" ? (
            <button
              type="button"
              onClick={() => navigate(`/session-details/${payload.sessionId}`)}
              className="cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-xl bg-violet-50 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition"
            >
              View Session Details <ArrowRight size={14} />
            </button>
          ) : currentStatus === "rejected" || currentStatus === "cancelled" ? (
            <p className="text-center text-xs text-slate-400 py-1">
              This request was {currentStatus}.
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsNegotiateOpen(true)}
                className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/60 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition"
              >
                <Sparkles size={14} />
                Negotiate Timing
              </button>

              {isMentor && (
                <>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleAccept}
                    className="cursor-pointer inline-flex items-center justify-center gap-1 rounded-xl bg-green-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    Accept
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleDecline}
                    className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-slate-200 px-2.5 py-2 text-xs font-semibold text-slate-500 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50"
                  >
                    <XCircle size={14} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <NegotiateTimingModal
        isOpen={isNegotiateOpen}
        onClose={() => setIsNegotiateOpen(false)}
        sessionId={payload.sessionId}
        conversationId={conversationId}
        currentDate={currentDate}
        currentTime={currentTime}
        topic={payload.topic}
      />
    </>
  );
}
