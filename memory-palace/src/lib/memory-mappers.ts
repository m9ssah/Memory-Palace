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
  api_world_id?: string | null;
  marble_url?: string | null;
};

export function mapMemoryRecord(record: MemoryRecord): Memory {
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? undefined,
    imageUrl: record.image_url ?? undefined,
    imagePath: record.image_path ?? undefined,
    worldId: record.world_id ?? undefined,
    tags: record.tags ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    apiWorldId: record.api_world_id ?? undefined,
    marbleUrl: record.marble_url ?? undefined,
  };
}

export function isMemoryWorldReady(memory: Memory): boolean {
  return Boolean(memory.marbleUrl || memory.apiWorldId || memory.worldId);
}