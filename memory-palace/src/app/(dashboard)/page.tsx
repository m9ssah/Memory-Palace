import Link from "next/link";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatsOverview from "@/components/dashboard/StatsOverview";
import { formatDate, formatDuration } from "@/lib/utils";
import type { Session } from "@/types";

// TODO: Replace with real data fetching from API
const mockSession: Session = {
  id: "s-001",
  memoryId: "m-001",
  memoryTitle: "Grandma's Garden",
  startedAt: "2026-03-12T10:30:00Z",
  endedAt: "2026-03-12T11:05:00Z",
  durationMinutes: 35,
  engagementScore: 82,
  notes:
    "Patient was very responsive when viewing the rose bushes. Mentioned her mother's garden in detail. Good emotional connection observed.",
};

const mockStats = [
  { label: "Total Sessions", value: "12" },
  { label: "Total Memories", value: "5" },
  { label: "Avg Duration", value: formatDuration(28) },
  { label: "Avg Engagement", value: "78%" },
];

export default function DashboardPage() {
  const patientName = "Patient";
  const recentSession: Session | null = mockSession;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back
        </h1>
        <p className="text-foreground/60 mt-1">
          Managing sessions for <span className="font-medium text-palace-primary">{patientName}</span>
        </p>
      </div>

      {/* Quick Stats */}
      <StatsOverview stats={mockStats} />

      {/* Past Session Summary */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground/80">
          Most Recent Session
        </h2>
        {recentSession ? (
          <Card glow>
            <div className="flex flex-col gap-3">
              <h3 className="text-xl font-bold text-palace-primary">
                {recentSession.memoryTitle}
              </h3>
              <div className="flex items-center gap-4 text-sm text-foreground/60">
                <span>{formatDate(recentSession.startedAt)}</span>
                <span className="h-1 w-1 rounded-full bg-foreground/30" />
                <span>
                  {recentSession.durationMinutes
                    ? formatDuration(recentSession.durationMinutes)
                    : "In progress"}
                </span>
              </div>
              {recentSession.engagementScore != null && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-foreground/60">
                    Engagement
                  </span>
                  <div className="h-2 flex-1 rounded-full bg-palace-light">
                    <div
                      className="h-full rounded-full bg-palace-primary transition-all"
                      style={{ width: `${recentSession.engagementScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-palace-primary">
                    {recentSession.engagementScore}%
                  </span>
                </div>
              )}
              {recentSession.notes && (
                <p className="text-sm text-foreground/60 line-clamp-2">
                  {recentSession.notes}
                </p>
              )}
            </div>
          </Card>
        ) : (
          <Card className="text-center py-10">
            <p className="text-foreground/50">No sessions yet</p>
            <p className="text-sm text-foreground/40 mt-1">
              Start a new session to begin memory therapy
            </p>
          </Card>
        )}
      </section>

      {/* Start Session */}
      <div className="flex justify-center pt-2">
        <Link href="/lobby">
          <Button variant="primary" size="lg">
            Start New Session
          </Button>
        </Link>
      </div>
    </div>
  );
}
