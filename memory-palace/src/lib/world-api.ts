import type { WorldAssets, WorldGeneration } from "@/types";
import fs from "fs";
import path from "path";

const API_BASE = "https://api.worldlabs.ai/marble/v1";

function getApiKey(): string {
  const key = process.env.WLT_API_KEY;
  if (!key) throw new Error("WLT_API_KEY environment variable is not set");
  return key;
}

async function apiRequest(
  method: string,
  pathname: string,
  data?: unknown,
  binaryData?: Blob,
): Promise<unknown> {
  const url = pathname.startsWith("http") ? pathname : API_BASE + pathname;

  const headers: Record<string, string> = {
    "WLT-Api-Key": getApiKey(),
  };

  let body: BodyInit | undefined;
  if (data) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(data);
  } else if (binaryData) {
    body = binaryData;
  }

  const res = await fetch(url, { method, headers, body });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`World Labs API error (${res.status}): ${errorBody}`);
  }

  const contentType = res.headers.get("Content-Type");
  if (contentType?.includes("application/json")) {
    return res.json();
  }
  return res;
}

/**
 * Upload a local image file and return its media asset ID.
 */
export async function uploadImage(filePath: string): Promise<string> {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).substring(1) || "jpg";

  // Step 1: Prepare upload
  const prepResult = (await apiRequest("POST", "/media-assets:prepare_upload", {
    file_name: fileName,
    kind: "image",
    extension: ext,
  })) as {
    media_asset: { id: string };
    upload_info: { upload_url: string; upload_method: string; required_headers?: Record<string, string> };
  };

  const mediaAssetId = prepResult.media_asset.id;
  const { upload_url, upload_method, required_headers } = prepResult.upload_info;

  // Step 2: Upload the file
  const fileData = new Blob([fs.readFileSync(filePath)]);
  const uploadRes = await fetch(upload_url, {
    method: upload_method,
    headers: required_headers ?? {},
    body: fileData,
  });

  if (!uploadRes.ok) {
    throw new Error(`Upload failed: ${uploadRes.status} ${uploadRes.statusText}`);
  }

  return mediaAssetId;
}

/**
 * Generate a 3D world from text or image.
 */
export async function generateWorld(options: {
  displayName: string;
  textPrompt?: string;
  imageUrl?: string;
  mediaAssetId?: string;
  model?: string;
}): Promise<string> {
  const { displayName, textPrompt, imageUrl, mediaAssetId, model = "Marble 0.1-mini" } = options;

  if (!textPrompt && !imageUrl && !mediaAssetId) {
    throw new Error("One of textPrompt, imageUrl, or mediaAssetId is required");
  }

  const worldPrompt: Record<string, unknown> = {};

  if (textPrompt) {
    worldPrompt.type = "text";
    worldPrompt.text_prompt = textPrompt;
  } else if (imageUrl) {
    worldPrompt.type = "image";
    worldPrompt.image_prompt = { source: "uri", uri: imageUrl };
  } else if (mediaAssetId) {
    worldPrompt.type = "image";
    worldPrompt.image_prompt = { source: "media_asset", media_asset_id: mediaAssetId };
  }

  const result = (await apiRequest("POST", "/worlds:generate", {
    display_name: displayName,
    model,
    world_prompt: worldPrompt,
  })) as { operation_id: string };

  return result.operation_id;
}

/**
 * Poll an operation until it completes or times out.
 */
export async function pollOperation(
  operationId: string,
  timeout = 600,
  interval = 10,
): Promise<WorldGeneration> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout * 1000) {
    const result = (await apiRequest("GET", `/operations/${operationId}`)) as {
      done?: boolean;
      error?: string;
      metadata?: { progress?: { status: string; description: string } };
      response?: Record<string, unknown>;
    };

    if (result.done) {
      if (result.error) {
        return { operationId, status: "failed", error: result.error };
      }
      return {
        operationId,
        status: "ready",
        worldData: parseWorldResult(result),
      };
    }

    const progress = result.metadata?.progress;
    await new Promise((resolve) => setTimeout(resolve, interval * 1000));

    // Yield status while in progress
    if (progress) {
      // Continue polling
    }
  }

  return { operationId, status: "failed", error: `Timeout after ${timeout}s` };
}

/**
 * Extract world assets from a completed operation result.
 */
function parseWorldResult(result: { response?: Record<string, unknown> }): WorldAssets {
  const response = (result.response ?? {}) as Record<string, unknown>;
  const assets = (response.assets ?? {}) as Record<string, unknown>;
  const splats = assets.splats as { spz_urls?: Record<string, string> } | undefined;
  const mesh = assets.mesh as { collider_mesh_url?: string } | undefined;
  const imagery = assets.imagery as { pano_url?: string } | undefined;

  // Extract world ID - try multiple possible field names
  const worldId = 
    (response.id as string) ||
    (response.world_id as string) ||
    (response.worldId as string) ||
    (assets.world_id as string) ||
    '';

  if (!worldId) {
    console.warn("World ID not found in response:", JSON.stringify(response).substring(0, 200));
  }

  return {
    worldId,
    marbleUrl: response.world_marble_url as string | undefined,
    caption: assets.caption as string | undefined,
    splats: splats?.spz_urls,
    meshUrl: mesh?.collider_mesh_url,
    panoramaUrl: imagery?.pano_url,
    thumbnailUrl: assets.thumbnail_url as string | undefined,
  };
}