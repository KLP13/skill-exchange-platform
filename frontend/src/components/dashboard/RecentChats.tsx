import { MessageSquare, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useChat } from "@/hooks/useChat";
import UserAvatar from "@/components/ui/UserAvatar";

const RecentChats = () => {
  const navigate = useNavigate();
  const { conversations, totalUnreadCount } = useChat();

  const recentList = conversations.slice(0, 3);

  return (
    <div className="rounded-3xl border border-violet-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-lg font-bold text-slate-800">
            Recent Chats
          </h2>
          {totalUnreadCount > 0 && (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
              {totalUnreadCount} unread
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => navigate("/messages")}
          className="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
        >
          View All <ArrowRight size={14} />
        </button>
      </div>

      <div className="mt-5 space-y-2.5">
        {recentList.length === 0 ? (
          <div className="rounded-2xl bg-slate-50/80 p-6 text-center">
            <MessageSquare className="mx-auto text-slate-400" size={24} />
            <p className="mt-2 text-xs font-semibold text-slate-600">
              No recent conversations
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Messages from mentors and learners will appear here.
            </p>
          </div>
        ) : (
          recentList.map((chat) => {
            const hasUnread = (chat.unreadCount || 0) > 0;

            return (
              <button
                key={chat.id}
                type="button"
                onClick={() => navigate(`/messages/${chat.id}`)}
                className={`flex w-full cursor-pointer items-center gap-3.5 rounded-2xl p-3 text-left transition hover:bg-violet-50/60 ${
                  hasUnread
                    ? "bg-violet-50/30 border border-violet-100/80"
                    : "border border-slate-100/60 bg-slate-50/30"
                }`}
              >
                <UserAvatar
                  avatar={chat.participantAvatar}
                  name={chat.participantName}
                  sizeClassName="h-11 w-11"
                  textClassName="text-xs font-bold"
                  className="rounded-xl shadow-2xs shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h3 className="font-semibold text-xs sm:text-sm text-slate-800 truncate">
                      {chat.participantName}
                    </h3>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {chat.lastMessageTime}
                    </span>
                  </div>

                  <p className="truncate text-xs text-slate-500 mt-0.5">
                    {chat.lastMessage}
                  </p>
                </div>

                {hasUnread && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1.5 text-[10px] font-bold text-white shrink-0">
                    {chat.unreadCount}
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentChats;