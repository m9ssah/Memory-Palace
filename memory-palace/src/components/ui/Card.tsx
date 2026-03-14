import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  glow?: boolean;
  className?: string;
}

export default function Card({ children, glow = false, className }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-palace-mid/40 bg-white/80 backdrop-blur-sm p-6",
        glow && "glow",
        className
      )}
    >
      {children}
    </div>
  );
}
