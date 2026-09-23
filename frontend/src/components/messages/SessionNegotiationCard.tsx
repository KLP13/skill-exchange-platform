import { useState } from "react";
import { Calendar, Clock, CheckCircle2, MessageSquare, Sparkles } from "lucide-react";
import { useSessions } from "@/hooks/useSessions";
import { useChat } from "@/hooks/useChat";
import NegotiateTimingModal from "./NegotiateTimingModal";

export interface SessionNegotiationPayload {
  type: "SESSION_NEGOTIATION";
  sessionId: string;
  proposedDate: string;
  rawDate?: string;
  proposedTime: string;
  topic?: string;
  note?: string;
  proposedByName?: string;
  proposedById?: string;
}

type SessionNegotiationCardProps = {
  payload: SessionNegotiationPayload;
  conversationId: string;
  isMe: boolean;
};

export default function SessionNegotiationCard({
  payload,
  conversationId,
  isMe,
}: SessionNegotiationCardProps) {
  const { currentUser, sessions, updateSessionTiming, acceptRequest } = useSessions();
  const { sendMessage } = useChat();

  const [isCounterOpen, setIsCounterOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  const liveSession = sessions.find((s) => s.id === payload.sessionId);
  const sessionStatus = liveSession?.status;
  const isCompleted = sessionStatus === "completed";
  const isInProgress = sessionStatus === "in_progress";
  const isConfirmed = sessionStatus === "upcoming" || isAccepted;
  const isCancelled = sessionStatus === "cancelled" || sessionStatus === "rejected";
  const isProposedByMe = payload.proposedById === currentUser.id || isMe;

  const handleAcceptTiming = async () => {
    setIsProcessing(true);
    try {
      // Update session timing and mark as accepted / upcoming
      await updateSessionTiming(
        payload.sessionId,
        payload.rawDate || payload.proposedDate,
        payload.proposedTime,
        payload.proposedTime,
        "upcoming"
      );
      acceptRequest(payload.sessionId);
      setIsAccepted(true);

      sendMessage(
        conversationId,
        `🎉 Great! I accepted the proposed time for **${payload.proposedDate}** at **${payload.proposedTime}**. The session is now confirmed!`
      );
    } catch (err) {
      console.error("Error accepting proposed timing:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="my-2 w-full max-w-md rounded-3xl border border-violet-200 bg-white p-5 shadow-sm transition hover:shadow-md">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Sparkles size={18} />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-violet-700">
                Timing Negotiation
              </span>
              <h4 className="text-xs font-semibold text-slate-600">
                {payload.proposedByName || (isProposedByMe ? "You" : "Participant")} proposed a new schedule
              </h4>
            </div>
          </div>

          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
              isCompleted
                ? "bg-emerald-100 text-emerald-800"
                : isInProgress
                ? "bg-emerald-100 text-emerald-700"
                : isConfirmed
                ? "bg-green-100 text-green-700"
                : isCancelled
                ? "bg-slate-100 text-slate-600"
                : "bg-violet-100 text-violet-700"
            }`}
          >
            {isCompleted
              ? "Completed"
              : isInProgress
              ? "In Progress"
              : isConfirmed
              ? "Agreed & Confirmed"
              : isCancelled
              ? "Cancelled"
              : "Proposed"}
          </span>
        </div>

        {/* Proposed Date & Time */}
        <div className="mt-3.5 space-y-2 text-xs text-slate-700">
          <div className="flex items-center gap-2">
            <Calendar size={15} className="text-violet-600 shrink-0" />
            <span className="font-semibold text-slate-800">Proposed Date:</span>
            <span>{payload.proposedDate}</span>
          </div>

          <div className="flex items-center gap-2">
            <Clock size={15} className="text-violet-600 shrink-0" />
            <span className="font-semibold text-slate-800">Proposed Time:</span>
            <span>{payload.proposedTime}</span>
          </div>

          {payload.note && (
            <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-600 leading-relaxed">
              <MessageSquare size={14} className="mt-0.5 shrink-0 text-slate-400" />
              <span>{payload.note}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          {isCompleted ? (
            <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-emerald-700">
              <CheckCircle2 size={16} />
              Session completed successfully
            </div>
          ) : isInProgress ? (
            <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-emerald-700">
              <Sparkles size={16} />
              Session is currently in progress
            </div>
          ) : isConfirmed ? (
            <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-green-700">
              <CheckCircle2 size={16} />
              Session timing confirmed!
            </div>
          ) : isCancelled ? (
            <div className="flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-slate-500">
              This session was cancelled.
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {!isProposedByMe && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleAcceptTiming}
                  className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-green-600 py-2 text-xs font-semibold text-white hover:bg-green-700 transition disabled:opacity-50"
                >
                  <CheckCircle2 size={15} />
                  Accept New Time
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsCounterOpen(true)}
                className="cursor-pointer flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50/60 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition"
              >
                <Sparkles size={14} />
                Counter-Propose
              </button>
            </div>
          )}
        </div>
      </div>

      <NegotiateTimingModal
        isOpen={isCounterOpen}
        onClose={() => setIsCounterOpen(false)}
        sessionId={payload.sessionId}
        conversationId={conversationId}
        currentDate={payload.proposedDate}
        currentTime={payload.proposedTime}
        topic={payload.topic || "Mentorship Session"}
      />
    </>
  );
}
