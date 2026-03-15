"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "◈" },
  { href: "/lobby", label: "Memory Lobby", icon: "✦" },
  { href: "/progress", label: "Progress", icon: "◉" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-56 flex-col bg-palace-light/50 backdrop-blur-sm border-r border-palace-mid/20 px-4 py-6">
      <Link href="/" className="mb-10 px-2">
        <h1 className="text-xl font-bold text-palace-primary tracking-tight">
          Memory Palace
        </h1>
        <p className="text-xs text-foreground/50 mt-0.5">Caregiver Dashboard</p>
      </Link>

      <nav className="flex flex-col gap-1">
        {links.map(({ href, label, icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-l-3 border-palace-primary text-palace-primary bg-white/60"
                  : "text-foreground/60 hover:text-foreground hover:bg-white/40"
              )}
            >
              <span className="text-base">{icon}</span>
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
