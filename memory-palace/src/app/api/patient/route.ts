import { NextRequest, NextResponse } from "next/server";
import { getPatient } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const patientId = request.nextUrl.searchParams.get("id") || "default";
		const patient = await getPatient(patientId);

		if (!patient) {
			return NextResponse.json(
				{ error: "Patient not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json(patient);
	} catch (error) {
		console.error("Error fetching patient:", error);
		return NextResponse.json(
			{ error: "Failed to fetch patient" },
			{ status: 500 }
		);
	}
}
