import { notFound } from "next/navigation";
import WorldViewer from "@/components/viewer/WorldViewer";
import { getMemory } from "@/lib/db";
import { mapMemoryRecord } from "@/lib/memory-mappers";

type ViewerPageProps = {
	params: Promise<{ memoryId: string }>;
};

export default async function ViewerPage({ params }: ViewerPageProps) {
	const { memoryId } = await params;
	const memory = getMemory(memoryId);

	if (!memory) {
		notFound();
	}

	return <WorldViewer memory={mapMemoryRecord(memory as never)} />;
}
