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
	const memories = demoMemories;

	return (
		<section className="space-y-6">
			<div className="max-w-3xl">
				<p className="text-xs uppercase tracking-[0.3em] text-foreground">3D Lobby</p>
				<h1 className="mt-3 text-4xl tracking-tight sm:text-5xl text-3xl font-bold text-foreground">
					Memory palace preview.
				</h1>
				<p className="mt-4 text-base leading-7 text-foreground/60 sm:text-lg">
					The lobby is currently running with a local placeholder memory so you can test navigation and interactions without requiring database setup.
				</p>
			</div>

			<MemoryLobbyScene memories={memories} />
		</section>
	);
}
