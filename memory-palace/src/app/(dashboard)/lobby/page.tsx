"use client";

import { useCallback } from "react";
import MemoryLobbyScene from "@/components/lobby/MemoryLobbyScene";
import { getAllMemories } from "@/lib/db";
import { mapMemoryRecord } from "@/lib/memory-mappers";

export default async function LobbyPage() {
	let memories: ReturnType<typeof mapMemoryRecord>[] = [];
	try {
		const raw = await getAllMemories();
		const mapped = (raw ?? []).map(mapMemoryRecord);
		const renderable = mapped.filter((memory) => Boolean(memory.splatUrl));
		memories = renderable.length > 0 ? renderable : mapped;
	} catch (error) {
		console.error("Failed to fetch memories for lobby", error);
		// Fall through to lobby with fallback memories.
	}

	return (
		<div className="fixed inset-0 z-50">
			<MemoryLobbyScene memories={memories} />
		</div>
	);
}
