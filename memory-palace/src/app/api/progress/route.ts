import { NextResponse } from "next/server";
import { getAllCognitiveProfiles } from "@/lib/db";
export async function GET() {
  try {
    const profiles = await getAllCognitiveProfiles();

    const points = profiles.map((p: Record<string, unknown>) => {
      const sessions = p.sessions as Record<string, unknown> | null;
      const memories = sessions?.memories as Record<string, unknown> | null;
      return {
        date: (sessions?.started_at as string) ?? (p.created_at as string),
        sessionId: p.session_id as string,
        memoryTitle: (memories?.title as string) ?? undefined,
        wordFindingDifficulty: p.word_finding_difficulty as number,
        vocabularyRichness: p.vocabulary_richness as number,
        informationDensity: p.information_density as number,
        emotionalValence: p.emotional_valence as number,
        coherence: p.coherence as number,
        summary: p.summary as string,
      };
    });

    return NextResponse.json(points);
  } catch (err) {
    console.error("GET /api/progress error:", err);
    return NextResponse.json({ error: "Failed to fetch progress data" }, { status: 500 });
  }
}
