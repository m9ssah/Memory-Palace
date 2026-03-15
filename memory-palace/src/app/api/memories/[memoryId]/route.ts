import { NextResponse } from "next/server";
import { getMemory } from "@/lib/db";
import { mapMemoryRecord } from "@/lib/memory-mappers";

type RouteContext = {
	params: Promise<{ memoryId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
	const { memoryId } = await context.params;
	const memory = await getMemory(memoryId);

	if (!memory) {
		return NextResponse.json({ error: "Memory not found" }, { status: 404 });
	}

	return NextResponse.json(mapMemoryRecord(memory as never));
}
