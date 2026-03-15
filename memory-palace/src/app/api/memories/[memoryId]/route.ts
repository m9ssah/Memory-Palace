import { NextRequest, NextResponse } from "next/server";
import { getMemory, updateMemory, deleteMemory } from "@/lib/db";
import { mapMemoryRecord } from "@/lib/memory-mappers";

type RouteContext = {
	params: Promise<{ memoryId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
	try {
		const { memoryId } = await context.params;
		const memory = await getMemory(memoryId);

		if (!memory) {
			return NextResponse.json({ error: "Memory not found" }, { status: 404 });
		}

		return NextResponse.json(mapMemoryRecord(memory as never));
	} catch (error) {
		console.error("Error fetching memory:", error);
		return NextResponse.json(
			{ error: "Failed to fetch memory" },
			{ status: 500 }
		);
	}
}

export async function PUT(request: NextRequest, context: RouteContext) {
	try {
		const { memoryId } = await context.params;
		const body = await request.json();

		// Verify memory exists
		const memory = await getMemory(memoryId);
		if (!memory) {
			return NextResponse.json(
				{ error: "Memory not found" },
				{ status: 404 }
			);
		}

		await updateMemory(memoryId, body);

		const updated = await getMemory(memoryId);
		return NextResponse.json(mapMemoryRecord(updated as never));
	} catch (error) {
		console.error("Error updating memory:", error);
		return NextResponse.json(
			{ error: "Failed to update memory" },
			{ status: 500 }
		);
	}
}

export async function DELETE(request: NextRequest, context: RouteContext) {
	try {
		const { memoryId } = await context.params;

		// Verify memory exists
		const memory = await getMemory(memoryId);
		if (!memory) {
			return NextResponse.json(
				{ error: "Memory not found" },
				{ status: 404 }
			);
		}

		await deleteMemory(memoryId);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting memory:", error);
		return NextResponse.json(
			{ error: "Failed to delete memory" },
			{ status: 500 }
		);
	}
}
