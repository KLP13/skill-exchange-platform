import api from "./api";
import type { Session } from "@/data/sessions";

export interface BookSessionPayload {
  mentorId: string;
  skillName?: string;
  topic: string;
  sessionDescription?: string;
  learnerGoal?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  durationMinutes?: number;
  credits?: number;
  status?: string;
}

export const sessionApi = {
  async getMySessions(): Promise<Session[]> {
    const res = await api.get<{ success: boolean; data: Session[] }>("/sessions/my");
    return res.data.data;
  },

  async bookSession(payload: BookSessionPayload): Promise<{ success: boolean; message: string; sessionId: string }> {
    const res = await api.post<{ success: boolean; message: string; sessionId: string }>("/sessions/book", payload);
    return res.data;
  },

  async updateSessionStatus(sessionId: string, status: string): Promise<{ success: boolean; message: string }> {
    const res = await api.patch<{ success: boolean; message: string }>(`/sessions/${sessionId}/status`, { status });
    return res.data;
  },

  async updateSessionTiming(
    sessionId: string,
    payload: { scheduledDate: string; startTime: string; endTime: string; status?: string }
  ): Promise<{ success: boolean; message: string; data: any }> {
    const res = await api.put<{ success: boolean; message: string; data: any }>(
      `/sessions/${sessionId}/timing`,
      payload
    );
    return res.data;
  },
};

