import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowDown } from "lucide-react";
import type { Message } from "@/data/messages";
import { useSessions } from "@/hooks/useSessions";
import MessageBubble from "./MessageBubble";

type MessageListProps = {
  messages: Message[];
  conversationId?: string;
};

const MessageList = ({ messages, conversationId }: MessageListProps) => {
  const { currentUser } = useSessions();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const scrollEndRef = useRef<HTMLDivElement | null>(null);
  const prevCountRef = useRef<number>(0);
  const prevLastMsgIdRef = useRef<string | null>(null);
  const currentConvIdRef = useRef<string | undefined>(conversationId);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Check if user is near the bottom (within 140px threshold)
  const isNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    return distanceToBottom <= 140;
  }, []);

  const handleScroll = () => {
    const near = isNearBottom();
    setShowScrollBottom(!near);
  };

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    if (scrollEndRef.current) {
      scrollEndRef.current.scrollIntoView({ behavior });
    }
  };

  // Reset scroll to bottom when switching conversation
  useEffect(() => {
    if (conversationId !== currentConvIdRef.current) {
      currentConvIdRef.current = conversationId;
      prevCountRef.current = messages.length;
      prevLastMsgIdRef.current = messages[messages.length - 1]?.id || null;
      // Scroll to bottom immediately on conversation switch
      requestAnimationFrame(() => {
        scrollToBottom("auto");
      });
    }
  }, [conversationId, messages]);

  // Initial load
  useEffect(() => {
    if (messages.length > 0 && prevCountRef.current === 0) {
      scrollToBottom("auto");
      prevCountRef.current = messages.length;
      prevLastMsgIdRef.current = messages[messages.length - 1]?.id || null;
      return;
    }

    const lastMsg = messages[messages.length - 1];
    const isNewMessage =
      messages.length > prevCountRef.current ||
      (lastMsg && lastMsg.id !== prevLastMsgIdRef.current);

    if (isNewMessage && lastMsg) {
      const isSentByMe = lastMsg.senderId === currentUser?.id;
      const wasAtBottom = isNearBottom();

      // If user sent the message, always scroll down.
      // If other user sent it, only auto-scroll if user is already at the bottom.
      if (isSentByMe || wasAtBottom) {
        scrollToBottom("smooth");
      }
    }

    prevCountRef.current = messages.length;
    prevLastMsgIdRef.current = lastMsg?.id || null;
  }, [messages, currentUser?.id, isNearBottom]);

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#faf9fd]"
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-center">
            <p className="text-sm text-slate-400">
              No messages yet. Send a message to start chatting!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}
        <div ref={scrollEndRef} className="h-0.5" />
      </div>

      {/* Floating jump to bottom button when scrolled up */}
      {showScrollBottom && (
        <button
          type="button"
          onClick={() => scrollToBottom("smooth")}
          className="cursor-pointer absolute bottom-4 right-6 flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-white shadow-xl transition-all hover:bg-violet-700 hover:scale-110 active:scale-95 z-20"
          title="Jump to latest message"
        >
          <ArrowDown size={18} />
        </button>
      )}
    </div>
  );
};

export default MessageList;
