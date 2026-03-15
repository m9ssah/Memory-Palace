import MemoryLobbyScene from "@/components/lobby/MemoryLobbyScene";
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
	return (
		<div className="fixed inset-0 z-50">
			<MemoryLobbyScene memories={demoMemories} />
		</div>
	);
}
