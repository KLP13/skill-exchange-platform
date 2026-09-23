import { useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import type { Conversation } from "@/data/messages";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

type ChatWindowProps = {
  conversation: Conversation;
  onBack?: () => void;
};

const ChatWindow = ({ conversation, onBack }: ChatWindowProps) => {
  const {
    getMessagesByConversationId,
    sendMessage,
    markConversationAsRead,
    setActiveConversationId,
  } = useChat();

  const messages = getMessagesByConversationId(conversation.id);

  // Keep ChatContext aware of the active conversation for real-time priority syncing
  useEffect(() => {
    setActiveConversationId(conversation.id);
    return () => {
      setActiveConversationId(null);
    };
  }, [conversation.id, setActiveConversationId]);

  // Mark messages and notifications as read when opening or viewing conversation
  useEffect(() => {
    markConversationAsRead(conversation.id);
  }, [conversation.id, messages.length, markConversationAsRead]);

  const handleSendMessage = (text: string) => {
    sendMessage(conversation.id, text);
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <ChatHeader conversation={conversation} onBack={onBack} />
      <MessageList messages={messages} conversationId={conversation.id} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;
