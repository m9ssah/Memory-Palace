import MemoryLobbyScene from "@/components/lobby/MemoryLobbyScene";
import { getAllMemories } from "@/lib/db";
import { isMemoryWorldReady, mapMemoryRecord } from "@/lib/memory-mappers";

export default function LobbyPage() {
	const allMemories = getAllMemories().map((record) => mapMemoryRecord(record as never));
	const readyMemories = allMemories.filter(isMemoryWorldReady);
	const memories = readyMemories.length > 0 ? readyMemories : allMemories;

	return (
		<section className="space-y-6">
			<div className="max-w-3xl">
				<p className="text-xs uppercase tracking-[0.3em] text-amber-300/80">3D Lobby</p>
				<h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-50 sm:text-5xl">
					Walk the gallery and step into a memory.
				</h1>
				<p className="mt-4 text-base leading-7 text-stone-300 sm:text-lg">
					Each framed object in the gallery can act as a portal to a previously generated memory world. The lobby highlights the available canvases and routes the caregiver or patient into the selected viewer.
				</p>
			</div>

			<MemoryLobbyScene memories={memories} />
		</section>
	);
}
