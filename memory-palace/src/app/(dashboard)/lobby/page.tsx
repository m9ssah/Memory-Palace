"use client";

import { useCallback } from "react";
import MemoryLobbyScene from "@/components/lobby/MemoryLobbyScene";
import SpeechRecorder from "@/components/lobby/SpeechRecorder";
import type { Memory } from "@/types";

const demoMemories: Memory[] = [
	{
		id: "demo-memory-1",
		title: "Family Kitchen",
		description: "Temporary placeholder memory used to preview the interactive lobby experience.",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	},
];

export default function LobbyPage() {
	const handleSessionEnd = useCallback((transcript: string) => {
		const words = transcript.split(/\s+/).filter(Boolean);
		if (words.length < 10) return;

		// Use keepalive so fetches survive page navigation/unmount
		fetch("/api/sessions", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ memoryId: demoMemories[0].id }),
			keepalive: true,
		})
			.then((res) => (res.ok ? res.json() : Promise.reject(res.statusText)))
			.then(({ id: sessionId }) =>
				fetch(`/api/sessions/${sessionId}/analyze`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ transcript }),
					keepalive: true,
				}),
			)
			.catch((err) => console.error("Failed to analyze speech:", err));
	}, []);

	return (
		<div className="fixed inset-0 z-50">
			<MemoryLobbyScene memories={demoMemories} />
			<SpeechRecorder onSessionEnd={handleSessionEnd} />
		</div>
	);
}
