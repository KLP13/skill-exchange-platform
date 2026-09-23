import type { Message } from "@/data/messages";
import { useSessions } from "@/hooks/useSessions";
import SessionRequestCard from "./SessionRequestCard";
import type { SessionRequestPayload } from "./SessionRequestCard";
import SessionNegotiationCard from "./SessionNegotiationCard";
import type { SessionNegotiationPayload } from "./SessionNegotiationCard";

type MessageBubbleProps = {
  message: Message;
};

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const { currentUser } = useSessions();
  const isMe = message.senderId === currentUser.id;

  // Check if message is a structured Session Request
  if (message.text.startsWith("[SESSION_REQUEST]:")) {
    try {
      const jsonStr = message.text.replace("[SESSION_REQUEST]:", "");
      const payload: SessionRequestPayload = JSON.parse(jsonStr);
      return (
        <div className={`flex w-full flex-col ${isMe ? "items-end" : "items-start"}`}>
          <SessionRequestCard
            payload={payload}
            conversationId={message.conversationId}
            isMe={isMe}
          />
          <span className="mt-1 px-1 text-[11px] text-slate-400">
            {message.timestamp}
          </span>
        </div>
      );
    } catch {
      // Fall back to standard rendering if JSON parse fails
    }
  }

  // Check if message is a structured Session Timing Negotiation
  if (message.text.startsWith("[SESSION_NEGOTIATION]:")) {
    try {
      const jsonStr = message.text.replace("[SESSION_NEGOTIATION]:", "");
      const payload: SessionNegotiationPayload = JSON.parse(jsonStr);
      return (
        <div className={`flex w-full flex-col ${isMe ? "items-end" : "items-start"}`}>
          <SessionNegotiationCard
            payload={payload}
            conversationId={message.conversationId}
            isMe={isMe}
          />
          <span className="mt-1 px-1 text-[11px] text-slate-400">
            {message.timestamp}
          </span>
        </div>
      );
    } catch {
      // Fall back to standard rendering if JSON parse fails
    }
  }

  return (
    <div
      className={`flex w-full flex-col ${
        isMe ? "items-end" : "items-start"
      }`}
    >
      <div
        className={`max-w-[80%] sm:max-w-[70%] break-words px-4 py-3 shadow-xs ${
          isMe
            ? "rounded-2xl rounded-tr-xs bg-violet-600 text-white text-sm"
            : "rounded-2xl rounded-tl-xs bg-slate-100 text-slate-800 text-sm"
        }`}
      >
        <p className="leading-relaxed whitespace-pre-wrap">{message.text}</p>
      </div>

      <span className="mt-1 px-1 text-[11px] text-slate-400">
        {message.timestamp}
      </span>
    </div>
  );
};

export default MessageBubble;

