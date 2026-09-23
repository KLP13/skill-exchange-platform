import api from "./api";

export interface CreateReviewPayload {
  sessionId: string;
  rating: number;
  comment?: string;
}

export interface ReviewItem {
  id: string;
  sessionId: string;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerName: string;
  reviewerAvatar?: string;
  sessionTopic?: string;
}

export const reviewApi = {
  async createReview(payload: CreateReviewPayload): Promise<{ success: boolean; message: string }> {
    const res = await api.post<{ success: boolean; message: string }>("/reviews", payload);
    return res.data;
  },

  async getMentorReviews(mentorId: string): Promise<ReviewItem[]> {
    const res = await api.get<{ success: boolean; data: ReviewItem[] }>(`/reviews/mentor/${mentorId}`);
    return res.data.data;
  },

  async getMyReviews(): Promise<any[]> {
    const res = await api.get<{ success: boolean; data: any[] }>("/reviews/my");
    return res.data.data;
  },
};
