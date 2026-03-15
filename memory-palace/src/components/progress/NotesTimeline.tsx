"use client";

interface TimelineEntry {
  date: string;
  sessionId: string;
  memoryTitle?: string;
  summary: string;
}

interface NotesTimelineProps {
  entries: TimelineEntry[];
}

export default function NotesTimeline({ entries }: NotesTimelineProps) {
  if (entries.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-sm text-foreground/40">
        No session summaries yet.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Session Summaries</h2>
      <div className="relative space-y-6 border-l border-white/10 pl-6">
        {entries.map((entry) => (
          <div key={entry.sessionId} className="relative">
            <div className="absolute -left-[1.56rem] top-1 h-2.5 w-2.5 rounded-full bg-purple-500" />
            <div className="text-xs text-foreground/40">
              {new Date(entry.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {entry.memoryTitle && (
                <span className="ml-2 text-purple-400">{entry.memoryTitle}</span>
              )}
            </div>
            <p className="mt-1 text-sm leading-relaxed text-foreground/70">{entry.summary}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
