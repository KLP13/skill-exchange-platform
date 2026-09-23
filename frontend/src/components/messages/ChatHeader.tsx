import { ArrowLeft, Calendar, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { Conversation } from "@/data/messages";
import { useSessions } from "@/hooks/useSessions";
import UserAvatar from "@/components/ui/UserAvatar";

type ChatHeaderProps = {
  conversation: Conversation;
  onBack?: () => void;
};

const ChatHeader = ({ conversation, onBack }: ChatHeaderProps) => {
  const navigate = useNavigate();
  const { getSessionById } = useSessions();

  const session = conversation.sessionId
    ? getSessionById(conversation.sessionId)
    : undefined;

  const handleProfileClick = () => {
    if (conversation.participantId) {
      navigate(`/profile/${conversation.participantId}`);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-violet-100 bg-white px-6 py-4">
      <div className="flex items-center gap-3.5">
        {/* Mobile back button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="cursor-pointer -ml-2 mr-1 rounded-xl p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-700 md:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft size={20} />
          </button>
        )}

        {/* Avatar (Clickable to profile) */}
        <button
          type="button"
          onClick={handleProfileClick}
          className="relative cursor-pointer transition hover:opacity-90 shrink-0"
          title={`View ${conversation.participantName}'s profile`}
        >
          <UserAvatar
            avatar={conversation.participantAvatar}
            name={conversation.participantName}
            sizeClassName="h-11 w-11"
            textClassName="text-sm font-bold"
          />
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
        </button>

        {/* Name & Role (Clickable to profile) */}
        <div>
          <button
            type="button"
            onClick={handleProfileClick}
            className="cursor-pointer text-left font-semibold text-slate-900 leading-tight hover:text-violet-700 transition"
          >
            {conversation.participantName}
          </button>
          <p className="text-xs text-slate-500">
            {conversation.participantRole} · <span className="text-green-600 font-medium">Online</span>
          </p>
        </div>
      </div>

      {/* Optional Session Association Badge */}
      {session && (
        <button
          type="button"
          onClick={() => navigate(`/session-details/${session.id}`)}
          className="cursor-pointer hidden sm:flex items-center gap-2 rounded-xl bg-violet-50 px-3.5 py-1.5 text-xs font-semibold text-violet-700 border border-violet-100 hover:bg-violet-100/80 transition"
          title="View related session details"
        >
          <Calendar size={14} className="text-violet-600" />
          <span className="truncate max-w-[160px]">{session.topic}</span>
          <ExternalLink size={12} className="text-violet-400" />
        </button>
      )}
    </div>
  );
};

export default ChatHeader;
