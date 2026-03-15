import { NextRequest, NextResponse } from "next/server";
import { createSession, getAllSessions } from "@/lib/db";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
	try {
		const sessions = await getAllSessions();
		return NextResponse.json(sessions);
	} catch (error) {
		console.error("Error fetching sessions:", error);
		return NextResponse.json(
			{ error: "Failed to fetch sessions" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { memoryId, worldId } = body;

		if (!memoryId) {
			return NextResponse.json(
				{ error: "memoryId is required" },
				{ status: 400 }
			);
		}

		const sessionId = uuidv4();
		await createSession(sessionId, memoryId, worldId);

		return NextResponse.json(
			{ sessionId, memoryId, worldId: worldId ?? null },
			{ status: 201 }
		);
	} catch (error) {
		console.error("Error creating session:", error);
		return NextResponse.json(
			{ error: "Failed to create session" },
			{ status: 500 }
		);
	}
}
