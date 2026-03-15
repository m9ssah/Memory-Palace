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

    const apiKey = process.env.OPENAI_API_KEY || "test";
    const apiBase = process.env.HF_ENDPOINT_URL || "https://qyt7893blb71b5d3.us-east-2.aws.endpoints.huggingface.cloud/v1";

    const systemPrompt = `You are a clinical speech analyst specializing in cognitive assessment for dementia patients. Analyze the following speech transcript and return a JSON object with these fields:

- wordFindingDifficulty (0-100): Higher = more difficulty. Look for pauses, filler words, circumlocution, word substitutions.
- vocabularyRichness (0-100): Higher = richer vocabulary. Measure type-token ratio, word sophistication, variety.
- informationDensity (0-100): Higher = more information per utterance. Ratio of content words to total words.
- emotionalValence (0-100): 0 = very negative, 50 = neutral, 100 = very positive. Overall emotional tone.
- coherence (0-100): Higher = more coherent. Measure topic maintenance, logical flow, sentence completion.
- totalWords (integer): Total word count.
- uniqueWords (integer): Number of distinct words used.
- fillerCount (integer): Count of filler words (um, uh, like, you know, etc.).
- summary (string): 2-3 sentence clinical summary of the speech patterns observed.

Return ONLY valid JSON, no markdown or explanation.`;

    const llmRes = await fetch(`${apiBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        temperature: 0.3,
        max_tokens: 1024,
      }),
    });

    if (!llmRes.ok) {
      const errText = await llmRes.text();
      console.error("LLM API error:", errText);
      return NextResponse.json({ error: "LLM analysis failed" }, { status: 502 });
    }

    const llmData = await llmRes.json();
    const rawContent = llmData.choices[0].message.content;
    // Extract JSON 
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
