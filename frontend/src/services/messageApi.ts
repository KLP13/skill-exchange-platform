import api from "./api";
import type { Conversation, Message } from "@/data/messages";

export interface SendMessagePayload {
  recipientId?: string;
  conversationId?: string;
  text: string;
  sessionId?: string;
}

export const messageApi = {
  async getConversations(): Promise<Conversation[]> {
    const res = await api.get<{ success: boolean; data: Conversation[] }>("/messages/conversations");
    return res.data.data;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    const res = await api.get<{ success: boolean; data: Message[] }>(`/messages/${conversationId}`);
    return res.data.data;
  },

  async sendMessage(payload: SendMessagePayload): Promise<Message> {
    const res = await api.post<{ success: boolean; data: Message }>("/messages/send", payload);
    return res.data.data;
  },

  async markAsRead(conversationId: string): Promise<{ success: boolean }> {
    const res = await api.patch<{ success: boolean }>(`/messages/${conversationId}/read`);
    return res.data;
  },
};
