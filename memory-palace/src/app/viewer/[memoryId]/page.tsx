import { redirect } from "next/navigation";
import SplatViewerScene from "@/components/SplatViewerScene";
import { mapMemoryRecord } from "@/lib/memory-mappers";
import { supabase } from "@/lib/db";

type ViewerPageProps = {
	params: Promise<{ memoryId: string }>;
};

export default async function ViewerPage({ params }: ViewerPageProps) {
	const { memoryId } = await params;
	const { data, error } = await supabase
		.from("memories")
		.select("*, worlds(api_world_id, marble_url, splats_urls)")
		.eq("id", memoryId)
		.single();

	if (error || !data) {
		redirect("/lobby");
	}

	return <SplatViewerScene memory={mapMemoryRecord(data)} />;
}
