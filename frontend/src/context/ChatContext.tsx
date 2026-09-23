import { createContext, useMemo, useState, useEffect, useRef, useCallback } from "react";
import type { ReactNode } from "react";
import {
  initialConversations,
  initialMessages,
} from "@/data/messages";
import type { Conversation, Message } from "@/data/messages";
import { useSessions } from "@/hooks/useSessions";
import { useNotifications } from "@/hooks/useNotifications";
import { messageApi } from "@/services/messageApi";

export interface ChatContextType {
  conversations: Conversation[];
  messages: Message[];
  totalUnreadCount: number;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  syncChat: () => Promise<void>;
  getConversationById: (id: string | undefined) => Conversation | undefined;
  getConversationByParticipantName: (
    name: string
  ) => Conversation | undefined;
  getOrCreateConversation: (
    targetUserId: string,
    sessionId?: string
  ) => Conversation;
  getOrCreateConversationForMentor: (
    mentorName: string,
    mentorRole?: string,
    mentorAvatar?: string,
    sessionId?: string
  ) => Conversation;
  getMessagesByConversationId: (
    conversationId: string | undefined
  ) => Message[];
  sendMessage: (conversationId: string, text: string) => void;
  markConversationAsRead: (conversationId: string) => void;
  markAllAsRead: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(
  undefined
);

// Helper for current time formatting
const getCurrentTimeFormatted = (): string => {
  const now = new Date();
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes} ${ampm}`;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser, users, getUserById } = useSessions();
  const {
    addNotification,
    markNotificationsAsReadByRelatedId,
    markMessageNotificationsAsRead,
  } = useNotifications();

  const [rawConversations, setRawConversations] =
    useState<Conversation[]>(initialConversations);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const activeConversationIdRef = useRef<string | null>(null);
  activeConversationIdRef.current = activeConversationId;
  const isSyncingRef = useRef(false);
  const loadedInitialMessagesRef = useRef<Set<string>>(new Set());

  // Real-time synchronization of conversations and messages
  const syncChat = useCallback(async () => {
    if (!currentUser?.id || isSyncingRef.current) return;
    isSyncingRef.current = true;
    try {
      // 1. Fetch latest conversations
      const liveConvs = await messageApi.getConversations();
      if (liveConvs && liveConvs.length > 0) {
        setRawConversations((prev) => {
          const liveIds = new Set(liveConvs.map((c) => c.id));
          const remainingLocal = prev.filter((c) => !liveIds.has(c.id));
          return [...liveConvs, ...remainingLocal];
        });

        // 2. Determine which conversations to sync messages for:
        // - Currently active conversation
        // - Any conversation with unreadCount > 0
        // - Top 3 most recent conversations
        const convIdsToSync = new Set<string>();
        if (activeConversationIdRef.current) {
          convIdsToSync.add(activeConversationIdRef.current);
        }
        liveConvs.forEach((c) => {
          if ((c.unreadCount && c.unreadCount > 0) || convIdsToSync.size < 4) {
            convIdsToSync.add(c.id);
          }
        });

        // 3. Fetch messages for conversations in parallel
        await Promise.all(
          Array.from(convIdsToSync).map(async (convId) => {
            if (convId.startsWith("c-")) return;
            try {
              const liveMsgs = await messageApi.getMessages(convId);
              if (liveMsgs && liveMsgs.length > 0) {
                setMessages((prevMsgs) => {
                  const map = new Map<string, Message>();
                  prevMsgs.forEach((m) => map.set(m.id, m));
                  let hasChanges = false;
                  liveMsgs.forEach((lm) => {
                    const existing = map.get(lm.id);
                    if (!existing) {
                      map.set(lm.id, lm);
                      hasChanges = true;
                    } else if (
                      existing.isRead !== lm.isRead ||
                      existing.read !== lm.read ||
                      existing.text !== lm.text
                    ) {
                      map.set(lm.id, { ...existing, ...lm });
                      hasChanges = true;
                    }
                  });
                  return hasChanges ? Array.from(map.values()) : prevMsgs;
                });

                // If currently viewing this conversation, mark unread messages as read automatically
                if (convId === activeConversationIdRef.current) {
                  const hasUnread = liveMsgs.some(
                    (m) => m.receiverId === currentUser.id && (!m.read && !m.isRead)
                  );
                  if (hasUnread) {
                    messageApi.markAsRead(convId).catch(() => {});
                    markNotificationsAsReadByRelatedId(convId, currentUser.id);
                  }
                }
              }
            } catch {
              // ignore individual conversation fetch failure
            }
          })
        );
      }
    } catch (err) {
      console.warn("Real-time chat sync notice:", err);
    } finally {
      isSyncingRef.current = false;
    }
  }, [currentUser?.id, markNotificationsAsReadByRelatedId]);

  // Periodic polling & online/focus recovery
  useEffect(() => {
    if (!currentUser?.id) return;

    // Initial sync
    syncChat();

    // Regular background polling (2.5s) when window is visible
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        syncChat();
      }
    }, 2500);

    // Immediate sync when device comes back online or window regains focus
    const handleOnline = () => {
      syncChat();
    };
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        syncChat();
      }
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [currentUser?.id, syncChat]);

  // Derive user-specific conversation list dynamically for currentUser
  const userConversations: Conversation[] = useMemo(() => {
    return rawConversations
      .filter((c) => !c.participantIds || c.participantIds.includes(currentUser.id))
      .map((c) => {
        const otherParticipantId =
          c.participantIds?.find((id) => id !== currentUser.id) ||
          c.participantId;
        const otherUser = otherParticipantId
          ? getUserById(otherParticipantId) ||
            users.find((u) => u.id === otherParticipantId)
          : undefined;

        const convMessages = messages.filter((m) => m.conversationId === c.id);
        const lastMsg =
          convMessages.length > 0
            ? convMessages[convMessages.length - 1]
            : undefined;

        const unreadCount =
          convMessages.length > 0
            ? convMessages.filter((m) => m.receiverId === currentUser.id && (!m.read && !m.isRead)).length
            : c.unreadCount || 0;

        const participantName =
          otherUser?.name ||
          c.participantName ||
          (otherParticipantId ? `User ${otherParticipantId}` : "SkillSwap Member");

        const participantRole =
          otherUser?.role || c.participantRole || "Member";

        const participantAvatar =
          otherUser?.avatar ||
          participantName
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

        return {
          ...c,
          participantId: otherParticipantId || "",
          participantName,
          participantRole,
          participantAvatar,
          lastMessage: lastMsg ? lastMsg.text : c.lastMessage,
          lastMessageTime: lastMsg ? lastMsg.timestamp : c.lastMessageTime,
          unreadCount,
        };
      });
  }, [rawConversations, currentUser.id, getUserById, users, messages]);

  // Total unread messages for currentUser across all conversations
  const totalUnreadCount = useMemo(() => {
    return userConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  }, [userConversations]);

  const getConversationById = (
    id: string | undefined
  ): Conversation | undefined => {
    if (!id) return undefined;
    return userConversations.find((c) => c.id === id);
  };

  const getConversationByParticipantName = (
    name: string
  ): Conversation | undefined => {
    return userConversations.find(
      (c) =>
        c.participantName &&
        c.participantName.toLowerCase() === name.toLowerCase()
    );
  };

  // Find or create conversation by target user ID
  const getOrCreateConversation = (
    targetUserId: string,
    sessionId?: string
  ): Conversation => {
    // 1. Check if conversation already exists between currentUser and targetUserId
    const existing = rawConversations.find(
      (c) =>
        c.participantIds.includes(currentUser.id) &&
        c.participantIds.includes(targetUserId)
    );

    if (existing) {
      // If sessionId is provided and wasn't previously linked, update it
      if (sessionId && !existing.sessionId) {
        setRawConversations((prev) =>
          prev.map((c) => (c.id === existing.id ? { ...c, sessionId } : c))
        );
      }
      const enriched = userConversations.find((c) => c.id === existing.id);
      if (enriched) return enriched;
    }

    const otherUser =
      getUserById(targetUserId) || users.find((u) => u.id === targetUserId);

    const initials =
      otherUser?.avatar ||
      (otherUser?.name || "User")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const newConv: Conversation = {
      id: `c-${Date.now()}`,
      participantIds: [currentUser.id, targetUserId],
      sessionId,
      lastMessage: "Conversation started",
      lastMessageTime: getCurrentTimeFormatted(),
      unreadCount: 0,
      participantId: targetUserId,
      participantName: otherUser?.name || "SkillSwap User",
      participantRole: otherUser?.role || "Member",
      participantAvatar: initials,
    };

    setRawConversations((prev) => [newConv, ...prev]);
    return newConv;
  };

  // Compatibility helper for mentor names
  const getOrCreateConversationForMentor = (
    mentorName: string,
    _mentorRole?: string,
    _mentorAvatar?: string,
    sessionId?: string
  ): Conversation => {
    // Find target user from users list
    const cleanName = mentorName.toLowerCase().trim();
    const matchedUser = users.find(
      (u) =>
        u.name.toLowerCase().trim() === cleanName ||
        cleanName.includes(u.name.toLowerCase().trim()) ||
        u.name.toLowerCase().trim().includes(cleanName)
    );

    if (matchedUser) {
      return getOrCreateConversation(matchedUser.id, sessionId);
    }

    // Fallback if user ID is not directly matched by name
    const fallbackId = mentorName.toLowerCase().replace(/\s+/g, "-");
    return getOrCreateConversation(fallbackId, sessionId);
  };

  const getMessagesByConversationId = (
    conversationId: string | undefined
  ): Message[] => {
    if (!conversationId) return [];

    // Lazily fetch messages from backend on initial open if not yet loaded
    if (!loadedInitialMessagesRef.current.has(conversationId) && !conversationId.startsWith("c-")) {
      loadedInitialMessagesRef.current.add(conversationId);
      messageApi
        .getMessages(conversationId)
        .then((liveMsgs) => {
          if (liveMsgs && liveMsgs.length > 0) {
            setMessages((prevMsgs) => {
              const map = new Map<string, Message>();
              prevMsgs.forEach((m) => map.set(m.id, m));
              let hasChanges = false;
              liveMsgs.forEach((lm) => {
                const existing = map.get(lm.id);
                if (!existing) {
                  map.set(lm.id, lm);
                  hasChanges = true;
                } else if (
                  existing.isRead !== lm.isRead ||
                  existing.read !== lm.read ||
                  existing.text !== lm.text
                ) {
                  map.set(lm.id, { ...existing, ...lm });
                  hasChanges = true;
                }
              });
              return hasChanges ? Array.from(map.values()) : prevMsgs;
            });
          }
        })
        .catch((err) => {
          console.warn("Could not fetch messages from backend:", err);
        });
    }

    // Ensure current user is a participant of the conversation
    const conv = rawConversations.find((c) => c.id === conversationId);
    if (!conv || (conv.participantIds && !conv.participantIds.includes(currentUser.id))) {
      return [];
    }
    return messages.filter((m) => m.conversationId === conversationId);
  };

  const sendMessage = (conversationId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const conv = rawConversations.find((c) => c.id === conversationId);
    if (!conv || (conv.participantIds && !conv.participantIds.includes(currentUser.id))) {
      return;
    }

    // Receiver is the other participant
    const receiverId =
      conv.participantIds?.find((id) => id !== currentUser.id) ||
      conv.participantId ||
      conv.participantIds?.[0] ||
      "";

    const timeFormatted = getCurrentTimeFormatted();
    const tempId = `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newMessage: Message = {
      id: tempId,
      conversationId,
      senderId: currentUser.id,
      receiverId,
      senderName: currentUser.name,
      text: trimmed,
      timestamp: timeFormatted,
      read: false,
      isRead: false,
    };

    // Update messages state optimistically
    setMessages((prev) => [...prev, newMessage]);

    // Update conversation lastMessage & move to top
    setRawConversations((prev) => {
      const target = prev.find((c) => c.id === conversationId);
      if (!target) return prev;

      const updatedConv: Conversation = {
        ...target,
        lastMessage: trimmed,
        lastMessageTime: timeFormatted,
      };

      const others = prev.filter((c) => c.id !== conversationId);
      return [updatedConv, ...others];
    });

    // Create notification for receiverId ONLY
    const previewText =
      trimmed.length > 35 ? `${trimmed.substring(0, 32)}...` : trimmed;

    addNotification({
      userId: receiverId,
      type: "message",
      title: "New message",
      message: `New message from ${currentUser.name}: "${previewText}"`,
      timestamp: "Just now",
      relatedId: conversationId,
      relatedRoute: `/messages/${conversationId}`,
      group: "today",
    });

    // Send to backend PostgreSQL
    messageApi
      .sendMessage({
        conversationId: conversationId.startsWith("c-") ? undefined : conversationId,
        recipientId: receiverId,
        text: trimmed,
        sessionId: conv.sessionId,
      })
      .then((savedMsg) => {
        if (savedMsg) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId
                ? {
                    ...savedMsg,
                    senderName: currentUser.name,
                    timestamp: timeFormatted,
                  }
                : m
            )
          );
          if (
            savedMsg.conversationId &&
            savedMsg.conversationId !== conversationId
          ) {
            setRawConversations((prev) =>
              prev.map((c) =>
                c.id === conversationId
                  ? { ...c, id: savedMsg.conversationId }
                  : c
              )
            );
          }
          // Immediate sync to ensure latest state
          syncChat();
        }
      })
      .catch((err) => {
        console.warn("Could not save message to backend, keeping local copy:", err);
      });
  };

  const markConversationAsRead = (conversationId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (
          m.conversationId === conversationId &&
          m.receiverId === currentUser.id &&
          (!m.read || !m.isRead)
        ) {
          return {
            ...m,
            read: true,
            isRead: true,
          };
        }
        return m;
      })
    );

    // Clear notifications for this conversation in notifications tab & badge immediately
    markNotificationsAsReadByRelatedId(conversationId, currentUser.id);

    if (!conversationId.startsWith("c-")) {
      messageApi.markAsRead(conversationId).catch((err) => {
        console.warn("Failed to mark conversation read on backend:", err);
      });
    }
  };

  const markAllAsRead = () => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.receiverId === currentUser.id && (!m.read || !m.isRead)) {
          return {
            ...m,
            read: true,
            isRead: true,
          };
        }
        return m;
      })
    );
    markMessageNotificationsAsRead(currentUser.id);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations: userConversations,
        messages,
        totalUnreadCount,
        activeConversationId,
        setActiveConversationId,
        syncChat,
        getConversationById,
        getConversationByParticipantName,
        getOrCreateConversation,
        getOrCreateConversationForMentor,
        getMessagesByConversationId,
        sendMessage,
        markConversationAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
