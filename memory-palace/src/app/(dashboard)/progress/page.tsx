"use client";

import { useEffect, useState } from "react";
import EngagementChart from "@/components/progress/EngagementChart";
import NotesTimeline from "@/components/progress/NotesTimeline";
import type { CognitiveMetricPoint } from "@/types";

interface ProgressPoint extends CognitiveMetricPoint {
  summary?: string;
}

export default function ProgressPage() {
  const [data, setData] = useState<ProgressPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch("/api/progress");
        if (!res.ok) return;
        const points: ProgressPoint[] = await res.json();
        setData(points);
      } catch (err) {
        console.error("Failed to fetch progress:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <section className="space-y-6 p-8">
        <div className="h-8 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-80 animate-pulse rounded-2xl bg-white/[0.03]" />
      </section>
    );
  }

  const summaries = data
    .filter((p) => p.summary)
    .map((p) => ({
      date: p.date,
      sessionId: p.sessionId,
      memoryTitle: p.memoryTitle,
      summary: p.summary!,
    }));

  return (
    <section className="space-y-6 p-2 md:p-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-foreground/50">Analytics</p>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">Cognitive Progress</h1>
        <p className="mt-1 text-sm text-foreground/50">
          Speech analysis trends across therapy sessions
        </p>
      </div>

      <EngagementChart data={data} />
      <NotesTimeline entries={summaries} />
    </section>
  );
}
