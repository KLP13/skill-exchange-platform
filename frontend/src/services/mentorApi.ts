import api from "./api";
import type { User } from "@/data/mentors";

export interface SkillItem {
  id: string;
  name: string;
  category: string;
  description: string;
  department_code?: string;
  department_name?: string;
}

export interface DepartmentItem {
  id: string;
  code: string;
  name: string;
  description: string;
}

export const mentorApi = {
  async getMentors(params?: {
    search?: string;
    department?: string;
    skill?: string;
    category?: string;
  }): Promise<User[]> {
    const res = await api.get<{ success: boolean; data: User[] }>("/mentors", {
      params,
    });
    return res.data.data;
  },

  async getMentorById(id: string): Promise<User> {
    const res = await api.get<{ success: boolean; data: User }>(`/mentors/${id}`);
    return res.data.data;
  },

  async getSkills(): Promise<SkillItem[]> {
    const res = await api.get<{ success: boolean; data: SkillItem[] }>("/skills");
    return res.data.data;
  },

  async getDepartments(): Promise<DepartmentItem[]> {
    const res = await api.get<{ success: boolean; data: DepartmentItem[] }>("/skills/departments");
    return res.data.data;
  },

  async updateAvailability(
    availability: import("@/data/mentors").DayAvailability[]
  ): Promise<{ success: boolean; data: import("@/data/mentors").DayAvailability[] }> {
    const res = await api.put<{
      success: boolean;
      message: string;
      data: import("@/data/mentors").DayAvailability[];
    }>("/mentors/availability", { availability });
    return res.data;
  },
};

