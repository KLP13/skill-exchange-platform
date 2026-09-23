export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  senderName: string;
  text: string;
  timestamp: string;
  read: boolean;
  isRead: boolean; // Backwards-compatibility alias
}

export interface Conversation {
  id: string;
  participantIds: string[];
  sessionId?: string;
  lastMessageId?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  // Dynamic UI properties resolved per active user
  participantId?: string;
  participantName?: string;
  participantRole?: string;
  participantAvatar?: string;
}

export const initialConversations: Conversation[] = [];

export const initialMessages: Message[] = [];
