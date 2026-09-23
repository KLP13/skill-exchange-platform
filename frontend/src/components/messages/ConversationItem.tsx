import type { Conversation } from "@/data/messages";
import UserAvatar from "@/components/ui/UserAvatar";

type ConversationItemProps = {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
};

const ConversationItem = ({
  conversation,
  isActive,
  onSelect,
}: ConversationItemProps) => {
  const unreadCount = conversation.unreadCount || 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`cursor-pointer flex w-full items-center gap-3.5 rounded-2xl p-3.5 text-left transition-all duration-150 ${
        isActive
          ? "bg-violet-50/90 border border-violet-200/80 shadow-xs"
          : "hover:bg-slate-50 border border-transparent"
      }`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <UserAvatar
          avatar={conversation.participantAvatar}
          name={conversation.participantName}
          sizeClassName="h-12 w-12"
          textClassName="text-sm font-bold"
        />
        {unreadCount > 0 && (
          <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
        )}
      </div>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <h3 className="truncate font-semibold text-slate-900 text-sm">
            {conversation.participantName}
          </h3>
          <span className="shrink-0 text-xs text-slate-400">
            {conversation.lastMessageTime}
          </span>
        </div>

        <p className="mt-0.5 truncate text-xs text-slate-500">
          {conversation.participantRole}
        </p>

        <div className="mt-1 flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs ${
              unreadCount > 0
                ? "font-semibold text-slate-800"
                : "text-slate-500"
            }`}
          >
            {conversation.lastMessage}
          </p>

          {unreadCount > 0 && (
            <span className="shrink-0 rounded-full bg-violet-600 px-2 py-0.5 text-[11px] font-bold text-white">
              {unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationItem;
