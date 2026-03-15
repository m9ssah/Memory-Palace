import { NextRequest, NextResponse } from "next/server";
import { getSession, endSession, addSessionMessage, updateSessionEngagement } from "@/lib/db";

type RouteContext = {
	params: Promise<{ sessionId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
	try {
		const { sessionId } = await context.params;
		const session = await getSession(sessionId);

		if (!session) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(session);
	} catch (error) {
		console.error("Error fetching session:", error);
		return NextResponse.json(
			{ error: "Failed to fetch session" },
			{ status: 500 }
		);
	}
}

export async function POST(request: NextRequest, context: RouteContext) {
	try {
		const { sessionId } = await context.params;
		const body = await request.json();
		const { action, message, role, engagementScore, notes } = body;

		// Verify session exists
		const session = await getSession(sessionId);
		if (!session) {
			return NextResponse.json(
				{ error: "Session not found" },
				{ status: 404 }
			);
		}

		if (action === "addMessage") {
			if (!message || !role) {
				return NextResponse.json(
					{ error: "message and role are required" },
					{ status: 400 }
				);
			}
			await addSessionMessage(sessionId, role, message);
		} else if (action === "end") {
			await endSession(sessionId);
		} else if (action === "updateEngagement") {
			if (engagementScore === undefined) {
				return NextResponse.json(
					{ error: "engagementScore is required" },
					{ status: 400 }
				);
			}
			await updateSessionEngagement(sessionId, engagementScore, notes);
		} else {
			return NextResponse.json(
				{ error: "Unknown action" },
				{ status: 400 }
			);
		}

		const updated = await getSession(sessionId);
		return NextResponse.json(updated);
	} catch (error) {
		console.error("Error updating session:", error);
		return NextResponse.json(
			{ error: "Failed to update session" },
			{ status: 500 }
		);
	}
}
