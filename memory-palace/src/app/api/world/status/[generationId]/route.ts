import { NextRequest, NextResponse } from "next/server";
import { pollOperation } from "@/lib/world-api";
import { createWorld, getWorldByApiId, linkMemoryToWorld, linkWorldToMemory } from "@/lib/db";

type RouteContext = {
	params: Promise<{ generationId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
	try {
		const { generationId } = await context.params;
		
		// Get memoryId from query params if provided
		const url = new URL(request.url);
		const memoryId = url.searchParams.get("memoryId");

		// Poll the operation status
		const generation = await pollOperation(generationId, 600, 5);

		// If generation is complete and successful, store in database
		if (generation.status === "ready" && generation.worldData) {
			try {
				// Ensure we have a world ID
				if (!generation.worldData.worldId) {
					console.error("World ID not found in world data:", generation.worldData);
					return NextResponse.json({
						operationId: generation.operationId,
						status: "ready",
						worldData: generation.worldData,
						error: "World ID not available",
					});
				}

				// Check if world already exists
				let world;
				try {
					world = await getWorldByApiId(generation.worldData.worldId);
				} catch {
					// World doesn't exist yet, create it
					const worldId = await createWorld(
						generation.worldData.worldId,
						generation.worldData.worldId,
						generation.worldData
					);
					world = { id: worldId };
				}

				// Link memory to world if memoryId is provided
				if (memoryId && world?.id) {
					try {
						await linkMemoryToWorld(memoryId, world.id);
						await linkWorldToMemory(world.id, memoryId);
					} catch (linkError) {
						console.error("Error linking memory to world:", linkError);
						// Don't fail the response, just log the error
					}
				}

				return NextResponse.json({
					operationId: generation.operationId,
					status: "ready",
					worldData: generation.worldData,
					worldId: world?.id,
				});
			} catch (dbError) {
				console.error("Error storing world data:", dbError);
				// Still return success but note the storage error
				return NextResponse.json({
					operationId: generation.operationId,
					status: "ready",
					worldData: generation.worldData,
					storageError: true,
				});
			}
		}

		return NextResponse.json(generation);
	} catch (error) {
		console.error("Error checking generation status:", error);
		const message = error instanceof Error ? error.message : "Failed to check status";
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
