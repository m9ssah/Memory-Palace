import type { WorldGeneration } from "@/types";

const API_BASE = "https://api.worldlabs.ai/v1";

function getApiKey(): string {
  const key = process.env.WORLD_LABS_API_KEY;
  if (!key) throw new Error("WORLD_LABS_API_KEY environment variable is not set");
  return key;
}

function headers() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

export async function generateWorld(imageUrl: string): Promise<{ generationId: string }> {
  const res = await fetch(`${API_BASE}/generations`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      image_url: imageUrl,
      mode: "scene",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`World Labs API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return { generationId: data.generation_id };
}

export async function pollGenerationStatus(generationId: string): Promise<WorldGeneration> {
  const res = await fetch(`${API_BASE}/generations/${generationId}`, {
    headers: headers(),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`World Labs API error (${res.status}): ${body}`);
  }

  const data = await res.json();
  return {
    generationId: data.generation_id,
    status: data.status,
    progress: data.progress,
    assetUrl: data.asset_url,
    error: data.error,
  };
}

export async function getWorldAssets(generationId: string): Promise<{ assetUrl: string }> {
  const status = await pollGenerationStatus(generationId);
  if (status.status !== "ready" || !status.assetUrl) {
    throw new Error(`World not ready: status=${status.status}`);
  }
  return { assetUrl: status.assetUrl };
}
