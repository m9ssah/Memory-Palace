export interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  notes: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Memory {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  worldStatus: "pending" | "generating" | "ready" | "failed";
  generationId?: string;
  worldAssetUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  memoryId: string;
  memoryTitle?: string;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  engagementScore?: number;
  notes?: string;
}

export interface WorldGeneration {
  generationId: string;
  status: "pending" | "generating" | "ready" | "failed";
  progress?: number;
  assetUrl?: string;
  error?: string;
}

export interface PatientStats {
  totalSessions: number;
  totalMemories: number;
  avgSessionDuration: number;
  avgEngagementScore: number;
  sessionsThisWeek: number;
  recentSessions: Session[];
  engagementOverTime: { date: string; score: number }[];
  sessionFrequency: { week: string; count: number; avgDuration: number }[];
}
