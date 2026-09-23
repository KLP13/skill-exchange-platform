import api from "./api";

export interface SaveNotePayload {
  summary?: string;
  keyTakeaways?: string[];
  additionalNotes?: string;
  mentorFeedback?: string;
  recommendedResources?: Array<{ title: string; url: string }>;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  fileType?: string;
}

export interface NoteItem {
  id: string;
  sessionId: string;
  uploadedBy: string;
  summary?: string;
  keyTakeaways?: string[];
  additionalNotes?: string;
  mentorFeedback?: string;
  recommendedResources?: Array<{ title: string; url: string }>;
  fileName?: string;
  fileUrl?: string;
  fileSizeBytes?: number;
  fileType?: string;
  createdAt: string;
  uploadedByName: string;
}

export const noteApi = {
  async saveNotes(sessionId: string, payload: SaveNotePayload): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>(`/notes/${sessionId}`, payload);
    return res.data;
  },

  async getNotes(sessionId: string): Promise<NoteItem[]> {
    const res = await api.get<{ success: boolean; data: NoteItem[] }>(`/notes/${sessionId}`);
    return res.data.data;
  },
};
