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
  imageUrl?: string;
  imagePath?: string;
  worldId?: number;
  tags?: string;
  createdAt: string;
  updatedAt: string;
  // Joined from worlds table
  apiWorldId?: string;
  marbleUrl?: string;
}

export interface World {
  id: number;
  memoryId?: string;
  apiWorldId: string;
  name: string;
  model: string;
  marbleUrl?: string;
  caption?: string;
  splatsUrls?: string[];
  meshUrl?: string;
  panoramaUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  memoryId: string;
  memoryTitle?: string;
  worldId?: number;
  startedAt: string;
  endedAt?: string;
  durationMinutes?: number;
  engagementScore?: number;
  conversationLog?: ConversationMessage[];
  notes?: string;
}

export interface ConversationMessage {
  timestamp: string;
  role: string;
  content: string;
}

export interface WorldGeneration {
  operationId: string;
  status: "pending" | "generating" | "ready" | "failed";
  progress?: { status: string; description: string };
  worldData?: WorldAssets;
  error?: string;
}

export interface WorldAssets {
  worldId: string;
  marbleUrl?: string;
  caption?: string;
  splats?: Record<string, string>;
  meshUrl?: string;
  panoramaUrl?: string;
  thumbnailUrl?: string;
}

export interface CognitiveProfile {
  id: string;
  sessionId: string;
  transcript: string;
  wordFindingDifficulty: number;
  vocabularyRichness: number;
  informationDensity: number;
  emotionalValence: number;
  coherence: number;
  totalWords: number;
  uniqueWords: number;
  fillerCount: number;
  summary: string;
  createdAt: string;
}

export interface CognitiveMetricPoint {
  date: string;
  sessionId: string;
  memoryTitle?: string;
  wordFindingDifficulty: number;
  vocabularyRichness: number;
  informationDensity: number;
  emotionalValence: number;
  coherence: number;
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