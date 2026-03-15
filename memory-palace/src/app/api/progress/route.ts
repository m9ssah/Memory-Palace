import { NextResponse } from "next/server";
import { getAllCognitiveProfiles } from "@/lib/db";

export async function GET() {
	try {
		const profiles = await getAllCognitiveProfiles();

		const points = profiles.map((p) => ({
			date: p.created_at,
			sessionId: p.session_id,
			memoryTitle: p.sessions?.memories?.title ?? undefined,
			wordFindingDifficulty: p.word_finding_difficulty,
			vocabularyRichness: p.vocabulary_richness,
			informationDensity: p.information_density,
			emotionalValence: p.emotional_valence,
			coherence: p.coherence,
			summary: p.summary ?? undefined,
		}));

		return NextResponse.json(points);
	} catch (error) {
		console.error("Error fetching progress:", error);
		return NextResponse.json([], { status: 200 });
	}
}
