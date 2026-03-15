"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import StatsOverview from "@/components/dashboard/StatsOverview";
import NewSessionModal from "@/components/dashboard/NewSessionModal";
import { formatDate, formatDuration } from "@/lib/utils";
import { supabase } from "@/lib/db";
import type { Session } from "@/types";

export default function DashboardPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [recentSession, setRecentSession] = useState<Session & { imageUrl?: string } | null>(null);
  const [stats, setStats] = useState([
    { label: "Total Sessions", value: "–" },
    { label: "Total Memories", value: "–" },
    { label: "Avg Duration", value: "–" },
    { label: "Avg Engagement", value: "–" },
  ]);
  const [patientName, setPatientName] = useState("Patient");

  useEffect(() => {
    async function fetchDashboardData() {
      // fetch patient
      const { data: patient } = await supabase
        .from("patients")
        .select("name")
        .eq("id", "default")
        .maybeSingle();
      if (patient?.name) setPatientName(patient.name);

      // fetch most recent session with memory title
      const { data: sessions } = await supabase
        .from("sessions")
        .select("*, memories(title, image_url)")
        .order("started_at", { ascending: false })
        .limit(1);

      if (sessions && sessions.length > 0) {
        const s = sessions[0];
        setRecentSession({
          id: s.id,
          memoryId: s.memory_id,
          memoryTitle: s.memories?.title ?? undefined,
          imageUrl: s.memories?.image_url ?? undefined,
          startedAt: s.started_at,
          endedAt: s.ended_at ?? undefined,
          durationMinutes: s.duration_minutes ?? undefined,
          engagementScore: s.engagement_score ?? undefined,
          notes: s.notes ?? undefined,
        });
      }

      // fetch stats
      const { count: totalSessions } = await supabase
        .from("sessions")
        .select("*", { count: "exact", head: true });

      const { count: totalMemories } = await supabase
        .from("memories")
        .select("*", { count: "exact", head: true });

      const { data: durationData } = await supabase
        .from("sessions")
        .select("duration_minutes")
        .not("duration_minutes", "is", null);

      const { data: engagementData } = await supabase
        .from("sessions")
        .select("engagement_score")
        .not("engagement_score", "is", null);

      const avgDuration =
        durationData && durationData.length > 0
          ? durationData.reduce((sum, s) => sum + s.duration_minutes, 0) / durationData.length
          : 0;

      const avgEngagement =
        engagementData && engagementData.length > 0
          ? engagementData.reduce((sum, s) => sum + s.engagement_score, 0) / engagementData.length
          : 0;

      setStats([
        { label: "Total Sessions", value: String(totalSessions ?? 0) },
        { label: "Total Memories", value: String(totalMemories ?? 0) },
        { label: "Avg Duration", value: avgDuration > 0 ? formatDuration(Math.round(avgDuration)) : "–" },
        { label: "Avg Engagement", value: avgEngagement > 0 ? `${Math.round(avgEngagement)}%` : "–" },
      ]);
    }

    fetchDashboardData();
  }, []);

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
      <StatsOverview stats={stats} />

      {/* Past Session Summary */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-foreground/80">
          Most Recent Session
        </h2>
        {recentSession ? (
          <Card glow>
            <div className="flex gap-4">
              {recentSession.imageUrl ? (
                <img
                  src={recentSession.imageUrl}
                  alt={recentSession.memoryTitle ?? "Memory"}
                  className="h-32 w-32 flex-shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-xl bg-palace-light/50 text-3xl text-palace-primary/30">
                  ✦
                </div>
              )}
              <div className="flex flex-1 flex-col gap-2">
                <h3 className="text-lg font-bold text-palace-primary">
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
        <Button variant="primary" size="lg" onClick={() => setModalOpen(true)}>
          Start New Session
        </Button>
      </div>

      <NewSessionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
