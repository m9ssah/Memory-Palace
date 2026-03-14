"use client";

export default function ViewerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-foreground/60">{error.message}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-palace-primary px-4 py-2 text-white"
      >
        Try again
      </button>
    </div>
  );
}
