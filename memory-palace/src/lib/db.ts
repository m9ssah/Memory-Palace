import { WorldAssets } from "@/types";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// --------------- Memory operations ---------------

export async function createMemory(
  id: string,
  title: string,
  imageUrl?: string,
  imagePath?: string,
  description?: string,
  tags?: string,
) {
  const { error } = await supabase.from("memories").insert({
    id,
    title,
    image_url: imageUrl ?? null,
    image_path: imagePath ?? null,
    description: description ?? null,
    tags: tags ?? null,
  });
  if (error) throw error;
}

export async function getMemory(memoryId: string) {
  const { data, error } = await supabase
    .from("memories")
    .select("*, worlds!worlds_memory_id_fkey(api_world_id, marble_url)")
    .eq("id", memoryId)
    .single();
  if (error) throw error;
  return data;
}

export async function getAllMemories() {
  const { data, error } = await supabase
    .from("memories")
    .select("*, worlds!worlds_memory_id_fkey(api_world_id, marble_url)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateMemory(memoryId: string, updates: Record<string, unknown>) {
  const allowedFields = ["title", "description", "tags", "image_url", "image_path"];
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(updates)) {
    if (allowedFields.includes(key)) filtered[key] = updates[key];
  }
  if (Object.keys(filtered).length === 0) return;

  const { error } = await supabase
    .from("memories")
    .update({ ...filtered, updated_at: new Date().toISOString() })
    .eq("id", memoryId);
  if (error) throw error;
}

export async function deleteMemory(memoryId: string) {
  // Worlds linked via foreign key with ON DELETE SET NULL, so just delete the memory
  const { error } = await supabase.from("memories").delete().eq("id", memoryId);
  if (error) throw error;
}

// --------------- World operations ---------------

export async function createWorld(apiWorldId: string, name: string, worldData: WorldAssets) {
  const { data, error } = await supabase
    .from("worlds")
    .insert({
      api_world_id: apiWorldId,
      name,
      model: "Marble 0.1-mini",
      marble_url: (worldData.marbleUrl as string) ?? null,
      caption: (worldData.caption as string) ?? null,
      splats_urls: worldData.splats ? JSON.stringify(worldData.splats) : null,
      mesh_url: (worldData.meshUrl as string) ?? null,
      panorama_url: (worldData.panoramaUrl as string) ?? null,
      thumbnail_url: (worldData.thumbnailUrl as string) ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export async function getWorld(worldId: number) {
  const { data, error } = await supabase.from("worlds").select("*").eq("id", worldId).single();
  if (error) throw error;
  if (data?.splats_urls && typeof data.splats_urls === "string") {
    data.splats_urls = JSON.parse(data.splats_urls);
  }
  return data;
}

export async function getWorldByApiId(apiWorldId: string) {
  const { data, error } = await supabase.from("worlds").select("*").eq("api_world_id", apiWorldId).single();
  if (error) throw error;
  if (data?.splats_urls && typeof data.splats_urls === "string") {
    data.splats_urls = JSON.parse(data.splats_urls);
  }
  return data;
}

export async function linkMemoryToWorld(memoryId: string, worldId: number) {
  const { error } = await supabase
    .from("memories")
    .update({ world_id: worldId, updated_at: new Date().toISOString() })
    .eq("id", memoryId);
  if (error) throw error;
}

export async function linkWorldToMemory(worldId: number, memoryId: string) {
  const { error } = await supabase
    .from("worlds")
    .update({ memory_id: memoryId, updated_at: new Date().toISOString() })
    .eq("id", worldId);
  if (error) throw error;
}

// --------------- Session operations ---------------

export async function createSession(id: string, memoryId: string, worldId?: number) {
  const { error } = await supabase.from("sessions").insert({
    id,
    memory_id: memoryId,
    world_id: worldId ?? null,
  });
  if (error) throw error;
}

export async function getSession(sessionId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*, worlds(api_world_id, marble_url)")
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  if (data?.conversation_log && typeof data.conversation_log === "string") {
    data.conversation_log = JSON.parse(data.conversation_log);
  }
  return data;
}

export async function getSessionsByMemory(memoryId: string) {
  const { data, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("memory_id", memoryId)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s) => {
    if (s.conversation_log && typeof s.conversation_log === "string") {
      s.conversation_log = JSON.parse(s.conversation_log);
    }
    return s;
  });
}

export async function getAllSessions() {
  const { data, error } = await supabase
    .from("sessions")
    .select("*, memories(title)")
    .order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((s) => {
    if (s.conversation_log && typeof s.conversation_log === "string") {
      s.conversation_log = JSON.parse(s.conversation_log);
    }
    return s;
  });
}

export async function endSession(sessionId: string) {
  const { data: session, error: fetchErr } = await supabase
    .from("sessions")
    .select("started_at")
    .eq("id", sessionId)
    .single();
  if (fetchErr || !session) return;

  const durationMs = Date.now() - new Date(session.started_at).getTime();
  const durationMinutes = durationMs / 60000;

  const { error } = await supabase
    .from("sessions")
    .update({ ended_at: new Date().toISOString(), duration_minutes: durationMinutes })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function addSessionMessage(sessionId: string, role: string, content: string) {
  const { data: session, error: fetchErr } = await supabase
    .from("sessions")
    .select("conversation_log")
    .eq("id", sessionId)
    .single();
  if (fetchErr || !session) throw new Error(`Session ${sessionId} not found`);

  const log = session.conversation_log ? JSON.parse(session.conversation_log) : [];
  log.push({ timestamp: new Date().toISOString(), role, content });

  const { error } = await supabase
    .from("sessions")
    .update({ conversation_log: JSON.stringify(log) })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function updateSessionEngagement(sessionId: string, score: number, notes?: string) {
  const updates: Record<string, unknown> = { engagement_score: score };
  if (notes !== undefined) updates.notes = notes;

  const { error } = await supabase.from("sessions").update(updates).eq("id", sessionId);
  if (error) throw error;
}

// --------------- Patient operations ---------------

export async function getPatient(patientId: string = "default") {
  const { data, error } = await supabase.from("patients").select("*").eq("id", patientId).single();
  if (error) throw error;
  return data;
}
