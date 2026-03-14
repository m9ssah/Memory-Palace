import { NextResponse } from "next/server";
import { getAllMemories } from "@/lib/db";
import { mapMemoryRecord } from "@/lib/memory-mappers";

export async function GET() {
	const memories = getAllMemories().map((record) => mapMemoryRecord(record as never));
	return NextResponse.json(memories);
}
