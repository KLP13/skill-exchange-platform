import { useState } from "react";
import { X, Calendar, Clock, MessageSquare, Sparkles } from "lucide-react";
import { useSessions } from "@/hooks/useSessions";
import { useChat } from "@/hooks/useChat";

type NegotiateTimingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  conversationId: string;
  currentDate?: string;
  currentTime?: string;
  topic?: string;
};

export default function NegotiateTimingModal({
  isOpen,
  onClose,
  sessionId,
  conversationId,
  currentDate,
  currentTime,
  topic = "Mentorship Session",
}: NegotiateTimingModalProps) {
  const { currentUser, updateSessionTiming } = useSessions();
  const { sendMessage } = useChat();

  const todayStr = new Date().toISOString().split("T")[0];
  const [proposedDate, setProposedDate] = useState(todayStr);
  const [proposedTime, setProposedTime] = useState("18:00");
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposedDate || !proposedTime) return;

    setIsSubmitting(true);
    try {
      // 1. Update session in context and database
      await updateSessionTiming(
        sessionId,
        proposedDate,
        proposedTime,
        proposedTime,
        "pending"
      );

      // 2. Format display strings
      const dateObj = new Date(proposedDate);
      const displayDate = !isNaN(dateObj.getTime())
        ? dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : proposedDate;

      // 3. Send negotiation payload into chat
      const negotiationPayload = {
        type: "SESSION_NEGOTIATION",
        sessionId,
        proposedDate: displayDate,
        rawDate: proposedDate,
        proposedTime,
        topic,
        note: reason.trim() || "Proposed a different session time.",
        proposedByName: currentUser.name,
        proposedById: currentUser.id,
      };

      sendMessage(conversationId, `[SESSION_NEGOTIATION]:${JSON.stringify(negotiationPayload)}`);
      onClose();
    } catch (err) {
      console.error("Failed to propose timing:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-3xl border border-violet-100 bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Negotiate Timing</h3>
              <p className="text-xs text-slate-500">Propose a new date & time for {topic}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Schedule Info */}
        {(currentDate || currentTime) && (
          <div className="mt-4 rounded-2xl bg-slate-50 p-3.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">Current Proposed Time:</p>
            <p className="mt-0.5 text-slate-500">
              {currentDate} • {currentTime}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-violet-600" />
              Proposed Date
            </label>
            <input
              type="date"
              min={todayStr}
              value={proposedDate}
              onChange={(e) => setProposedDate(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock size={14} className="text-violet-600" />
              Proposed Time
            </label>
            <input
              type="time"
              value={proposedTime}
              onChange={(e) => setProposedTime(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <MessageSquare size={14} className="text-violet-600" />
              Note / Availability Reason
            </label>
            <textarea
              rows={2}
              placeholder="e.g., I have an exam at 5 PM, could we do 6 PM instead?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer rounded-xl bg-violet-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 hover:shadow-md disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Proposal"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
