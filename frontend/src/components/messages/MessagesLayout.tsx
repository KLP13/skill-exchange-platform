import { MessageSquare, ArrowLeft, Users, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import { useSessions } from "@/hooks/useSessions";

import Sidebar from "../dashboard/Sidebar";
import Topbar from "../dashboard/Topbar";

import ConversationList from "./ConversationList";
import ChatWindow from "./ChatWindow";

type MessagesLayoutProps = {
  conversationId?: string;
};

const MessagesLayout = ({ conversationId }: MessagesLayoutProps) => {
  const navigate = useNavigate();
  const { conversations, getConversationById, getOrCreateConversation } = useChat();
  const { currentUser, getUserById, users } = useSessions();

  const isSelf =
    Boolean(conversationId) &&
    (conversationId === currentUser.id ||
      conversationId === "me" ||
      (currentUser.email && conversationId?.toLowerCase() === currentUser.email.toLowerCase()));

  // Check if conversation exists directly by conversation ID
  const selectedConversation = conversationId
    ? getConversationById(conversationId) ||
      conversations.find((c) => c.id === conversationId)
    : undefined;

  // If conversationId is a target user ID, auto-initialize conversation with that user
  useEffect(() => {
    if (conversationId && !selectedConversation && !isSelf) {
      const targetUser =
        getUserById(conversationId) || users.find((u) => u.id === conversationId);
      if (targetUser && targetUser.id !== currentUser.id) {
        const conv = getOrCreateConversation(targetUser.id);
        if (conv?.id && conv.id !== conversationId) {
          navigate(`/messages/${conv.id}`, { replace: true });
        }
      }
    }
  }, [conversationId, selectedConversation, isSelf, currentUser.id, getUserById, users, getOrCreateConversation, navigate]);

  // Handle self messaging attempt
  if (isSelf) {
    return (
      <div className="flex min-h-screen bg-[#f8f7fc]">
        <Sidebar />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            <Topbar />

            <div className="mx-auto mt-16 max-w-lg text-center">
              <div className="rounded-3xl border border-violet-100 bg-white p-10 shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-600">
                  <Sparkles size={32} />
                </div>

                <h2 className="mt-4 text-2xl font-bold text-[#211653]">
                  Cannot Message Yourself
                </h2>

                <p className="mt-3 text-slate-500 text-sm leading-relaxed">
                  You are viewing your own profile. You can connect and message other campus peer mentors and learners on SkillSwap.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/explore")}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 hover:shadow-md"
                  >
                    <Users size={18} />
                    Explore Mentors
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/messages")}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <ArrowLeft size={18} />
                    View Messages
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Handle invalid or unauthorized conversation access
  if (conversationId && !selectedConversation) {
    return (
      <div className="flex min-h-screen bg-[#f8f7fc]">
        <Sidebar />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="p-6 md:p-8">
            <Topbar />

            <div className="mx-auto mt-16 max-w-lg text-center">
              <div className="rounded-3xl border border-violet-100 bg-white p-10 shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                  <MessageSquare size={32} />
                </div>

                <h2 className="mt-4 text-2xl font-bold text-[#211653]">
                  Conversation Not Found
                </h2>

                <p className="mt-3 text-slate-500 text-sm">
                  This conversation does not exist or has not been started yet.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/messages")}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3 font-semibold text-white transition hover:bg-violet-700 hover:shadow-md"
                  >
                    <ArrowLeft size={18} />
                    Back to Messages
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/explore")}
                    className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <Users size={18} />
                    Explore Mentors
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Active conversation for desktop fallback (if /messages is visited, default to first conversation if available on desktop)
  const activeConversation =
    selectedConversation ||
    (conversations.length > 0 ? conversations[0] : undefined);

  return (
    <div className="flex min-h-screen bg-[#f8f7fc]">
      <Sidebar />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          <Topbar />

          <div className="mt-6 flex h-[calc(100vh-160px)] min-h-[500px] overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
            {/* Left Pane: Conversation List */}
            <div
              className={`w-full md:w-80 lg:w-96 shrink-0 h-full ${
                conversationId ? "hidden md:block" : "block"
              }`}
            >
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversation?.id}
                onSelectConversation={(id) => navigate(`/messages/${id}`)}
              />
            </div>

            {/* Right Pane: Chat Window */}
            <div
              className={`flex-1 h-full min-w-0 ${
                conversationId ? "block" : "hidden md:block"
              }`}
            >
              {activeConversation ? (
                <ChatWindow
                  conversation={activeConversation}
                  onBack={() => navigate("/messages")}
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-[#faf9fd] p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-100 text-violet-600 shadow-xs">
                    <MessageSquare size={32} />
                  </div>

                  <h3 className="mt-4 text-xl font-bold text-slate-800">
                    Select a conversation
                  </h3>

                  <p className="mt-1.5 max-w-sm text-sm text-slate-500">
                    Choose a conversation from the left to start messaging with mentors and learners.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MessagesLayout;
