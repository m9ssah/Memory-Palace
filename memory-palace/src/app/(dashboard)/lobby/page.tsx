import MemoryLobbyScene from "@/components/lobby/MemoryLobbyScene";

export default function LobbyPage() {
	return (
		<div className="fixed inset-0 z-50">
			<MemoryLobbyScene memories={[]} />
		</div>
	);
}
