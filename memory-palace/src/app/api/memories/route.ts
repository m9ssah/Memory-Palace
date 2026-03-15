import { NextRequest, NextResponse } from "next/server";
import { createMemory, getAllMemories } from "@/lib/db";
import { mapMemoryRecord } from "@/lib/memory-mappers";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
	try {
		const memoriesRaw = await getAllMemories();
		const memories = memoriesRaw.map((record: any) => mapMemoryRecord(record));
		return NextResponse.json(memories);
	} catch (error) {
		console.error("Error fetching memories:", error);
		return NextResponse.json(
			{ error: "Failed to fetch memories" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { title, description, imageUrl, imagePath, tags, annotation } = body;

		console.log("POST /api/memories - Received body:", { title, description, tags, annotation, imageUrl: imageUrl ? "present" : "missing", imagePath });

		if (!title) {
			return NextResponse.json(
				{ error: "Title is required" },
				{ status: 400 }
			);
		}

		const id = uuidv4();
		await createMemory(id, title, imageUrl, imagePath, description, tags, annotation);

		const response = { id, title, description, imageUrl, imagePath, tags, annotation };
		console.log("POST /api/memories - Created memory:", { id, title, annotation });
		
		return NextResponse.json(response, { status: 201 });
	} catch (error) {
		console.error("Error creating memory:", error);
		return NextResponse.json(
			{ error: "Failed to create memory" },
			{ status: 500 }
		);
	}
}
