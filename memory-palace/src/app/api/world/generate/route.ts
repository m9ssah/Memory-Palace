import { NextRequest, NextResponse } from "next/server";
import { generateWorld, uploadImage } from "@/lib/world-api";
import { getMemory, createWorld, linkMemoryToWorld } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { memoryId, textPrompt, imageUrl, localImagePath, model } = body;

		// Validate inputs
		if (!textPrompt && !imageUrl && !localImagePath && !memoryId) {
			return NextResponse.json(
				{ error: "One of memoryId, textPrompt, imageUrl, or localImagePath is required" },
				{ status: 400 }
			);
		}

		let finalPrompt = textPrompt;
		let finalImageUrl = imageUrl;
		let mediaAssetId: string | undefined;

		// If memoryId provided, get memory details
		if (memoryId && !textPrompt && !imageUrl && !localImagePath) {
			const memory = await getMemory(memoryId);
			if (!memory) {
				return NextResponse.json(
					{ error: "Memory not found" },
					{ status: 404 }
				);
			}
			finalPrompt = memory.title;
			if (memory.description) {
				finalPrompt += ` - ${memory.description}`;
			}
			if (memory.imageUrl) {
				finalImageUrl = memory.imageUrl;
			} else if (memory.imagePath) {
				// Handle local file upload
				try {
					mediaAssetId = await uploadImage(memory.imagePath);
				} catch (uploadError) {
					console.error("Error uploading memory image:", uploadError);
					return NextResponse.json(
						{ error: "Failed to upload memory image" },
						{ status: 500 }
					);
				}
			}
		} else if (localImagePath && !imageUrl && !mediaAssetId) {
			// Upload local image file
			try {
				mediaAssetId = await uploadImage(localImagePath);
			} catch (uploadError) {
				console.error("Error uploading image:", uploadError);
				return NextResponse.json(
					{ error: "Failed to upload image" },
					{ status: 500 }
				);
			}
		}

		// Generate world
		const operationId = await generateWorld({
			displayName: finalPrompt?.substring(0, 100) || "Generated World",
			textPrompt: finalPrompt,
			imageUrl: finalImageUrl,
			mediaAssetId,
			model,
		});

		// Store generation in database (optional: map to memory if provided)
		// For now, return the operationId for polling
		return NextResponse.json(
			{
				operationId,
				status: "pending",
				memoryId: memoryId || null,
			},
			{ status: 202 }
		);
	} catch (error) {
		console.error("Error generating world:", error);
		const message = error instanceof Error ? error.message : "Failed to generate world";
		return NextResponse.json(
			{ error: message },
			{ status: 500 }
		);
	}
}
