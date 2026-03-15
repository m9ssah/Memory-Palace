import type { Memory } from "@/types";

type MemoryRecord = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_path: string | null;
  world_id: number | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
  worlds?: {
    api_world_id?: string | null;
    marble_url?: string | null;
    splats_urls?: string | null;
  } | null;
};

function extractFirstSplatUrl(splatsUrls?: string | null): string | null {
  if (!splatsUrls) return null;
  try {
    const parsed = JSON.parse(splatsUrls);
    if (typeof parsed === "string") return parsed;
    if (typeof parsed === "object" && parsed !== null) {
      const values = Object.values(parsed);
      if (values.length > 0 && typeof values[0] === "string") return values[0] as string;
    }
  } catch {
    if (splatsUrls.startsWith("http")) return splatsUrls;
  }
  return null;
}

export function mapMemoryRecord(record: MemoryRecord): Memory {
  const worlds = record.worlds;
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? undefined,
    imageUrl: record.image_url ?? undefined,
    imagePath: record.image_path ?? undefined,
    splatUrl: extractFirstSplatUrl(worlds?.splats_urls),
    worldId: record.world_id ?? undefined,
    tags: record.tags ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    apiWorldId: worlds?.api_world_id ?? undefined,
    marbleUrl: worlds?.marble_url ?? undefined,
  };
}

export function isMemoryWorldReady(memory: Memory): boolean {
  return Boolean(memory.marbleUrl || memory.apiWorldId || memory.worldId);
}