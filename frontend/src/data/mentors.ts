export type DayOfWeek =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface DayAvailability {
  day: DayOfWeek;
  enabled: boolean;
  startTime: string; // 24h format e.g. "17:00"
  endTime: string;   // 24h format e.g. "20:00"
}

export const createDefaultAvailability = (): DayAvailability[] => [
  { day: "monday", enabled: true, startTime: "17:00", endTime: "20:00" },
  { day: "tuesday", enabled: false, startTime: "17:00", endTime: "20:00" },
  { day: "wednesday", enabled: true, startTime: "16:00", endTime: "19:00" },
  { day: "thursday", enabled: false, startTime: "17:00", endTime: "20:00" },
  { day: "friday", enabled: true, startTime: "17:00", endTime: "20:00" },
  { day: "saturday", enabled: false, startTime: "14:00", endTime: "18:00" },
  { day: "sunday", enabled: false, startTime: "14:00", endTime: "18:00" },
];

export interface User {
  id: string;
  name: string;
  role: string;
  department: string;
  year: string;
  rating: number;
  reviewCount: number;
  credits: number;
  sessionsCount: number;
  avatar?: string;
  teachingSkill: string;
  teaches: string[];
  learns: string[];
  bio: string;
  experienceYears: string;
  projectsBuilt: string;
  languages: string;
  email?: string;
  location?: string;
  availability: DayAvailability[];
}

export type Mentor = User;

export const mentors: User[] = [];

export const users: User[] = mentors;

export const getUserById = (id: string | undefined): User | undefined => {
  if (!id) return undefined;
  return users.find((u) => u.id === String(id));
};

export const getMentorById = (id: string | undefined): User | undefined => {
  return getUserById(id);
};

export const getMentorByName = (name: string | undefined): User | undefined => {
  if (!name) return undefined;
  const cleanName = name.toLowerCase().trim();
  return users.find(
    (m) =>
      m.name.toLowerCase().trim() === cleanName ||
      cleanName.includes(m.name.toLowerCase().trim()) ||
      m.name.toLowerCase().trim().includes(cleanName)
  );
};
