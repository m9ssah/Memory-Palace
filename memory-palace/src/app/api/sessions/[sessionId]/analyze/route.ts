import { NextResponse } from "next/server";
import { createCognitiveProfile } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const { transcript } = await request.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json({ error: "transcript is required" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 503 },
      );
    }

    const systemPrompt = `You are a clinical speech analyst specializing in cognitive assessment for dementia patients. Analyze the following conversation transcript between a patient and their memory companion. Return a JSON object with these fields:

- wordFindingDifficulty (0-100): Higher = more difficulty. Look for pauses, filler words, circumlocution, word substitutions in the PATIENT's speech only.
- vocabularyRichness (0-100): Higher = richer vocabulary. Measure type-token ratio, word sophistication, variety in the PATIENT's speech only.
- informationDensity (0-100): Higher = more information per utterance. Ratio of content words to total words in the PATIENT's speech.
- emotionalValence (0-100): 0 = very negative, 50 = neutral, 100 = very positive. Overall emotional tone of the PATIENT.
- coherence (0-100): Higher = more coherent. Measure topic maintenance, logical flow, sentence completion in the PATIENT's speech.
- totalWords (integer): Total word count of the PATIENT's speech only.
- uniqueWords (integer): Number of distinct words used by the PATIENT.
- fillerCount (integer): Count of filler words (um, uh, like, you know, etc.) in the PATIENT's speech.
- summary (string): 2-3 sentence clinical summary of the patient's speech patterns and emotional state observed during this session.

Return ONLY valid JSON, no markdown or explanation.`;

    const llmRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        temperature: 0.3,
        max_completion_tokens: 1024,
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error("OpenAI API error:", errText);
      return NextResponse.json({ error: "Speech analysis failed" }, { status: 502 });
    }

    const llmData = await llmRes.json();
    const rawContent = llmData.choices[0].message.content;
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Failed to parse LLM response as JSON:", rawContent);
      return NextResponse.json({ error: "Invalid LLM response format" }, { status: 502 });
    }
    const analysis = JSON.parse(jsonMatch[0]);

    const profile = {
      id: uuidv4(),
      sessionId,
      transcript,
      wordFindingDifficulty: Math.round(analysis.wordFindingDifficulty ?? 0),
      vocabularyRichness: Math.round(analysis.vocabularyRichness ?? 0),
      informationDensity: Math.round(analysis.informationDensity ?? 0),
      emotionalValence: Math.round(analysis.emotionalValence ?? 50),
      coherence: Math.round(analysis.coherence ?? 0),
      totalWords: analysis.totalWords ?? 0,
      uniqueWords: analysis.uniqueWords ?? 0,
      fillerCount: analysis.fillerCount ?? 0,
      summary: analysis.summary ?? "",
    };

    await createCognitiveProfile(profile);

    return NextResponse.json(profile);
  } catch (err) {
    console.error("POST /api/sessions/[id]/analyze error:", err);
    return NextResponse.json({ error: "Failed to analyze transcript" }, { status: 500 });
  }
}
