import { cn } from "@/lib/utils";

export default function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "inline-block h-6 w-6 animate-spin rounded-full border-2 border-palace-mid border-t-palace-primary",
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}
