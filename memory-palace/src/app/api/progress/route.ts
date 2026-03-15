import { NextRequest, NextResponse } from "next/server";
import { getAllSessions } from "@/lib/db";

export async function GET(request: NextRequest) {
	try {
		const sessions = await getAllSessions();

		// Calculate stats
		const totalSessions = sessions.length;
		const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
		const avgSessionDuration = totalSessions > 0 ? totalDuration / totalSessions : 0;

		const engagementScores = sessions
			.filter((s) => s.engagement_score !== null && s.engagement_score !== undefined)
			.map((s) => s.engagement_score);
		const avgEngagementScore =
			engagementScores.length > 0
				? engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length
				: 0;

		// Sessions this week
		const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
		const sessionsThisWeek = sessions.filter(
			(s) => new Date(s.started_at) > oneWeekAgo
		).length;

		// Recent sessions
		const recentSessions = sessions.slice(0, 10);

		// Engagement over time
		const engagementByDate: Record<string, number[]> = {};
		sessions.forEach((s) => {
			if (s.engagement_score !== null && s.engagement_score !== undefined) {
				const date = new Date(s.started_at).toISOString().split("T")[0];
				if (!engagementByDate[date]) {
					engagementByDate[date] = [];
				}
				engagementByDate[date].push(s.engagement_score);
			}
		});

		const engagementOverTime = Object.entries(engagementByDate)
			.map(([date, scores]) => ({
				date,
				score: scores.reduce((a, b) => a + b, 0) / scores.length,
			}))
			.sort((a, b) => a.date.localeCompare(b.date));

		return NextResponse.json({
			totalSessions,
			totalMemories: sessions.length, // Approximate
			avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
			avgEngagementScore: Math.round(avgEngagementScore * 100) / 100,
			sessionsThisWeek,
			recentSessions,
			engagementOverTime,
		});
	} catch (error) {
		console.error("Error calculating progress:", error);
		return NextResponse.json(
			{ error: "Failed to calculate progress" },
			{ status: 500 }
		);
	}
}
