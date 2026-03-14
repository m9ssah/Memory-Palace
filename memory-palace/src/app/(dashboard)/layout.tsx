import Sidebar from "@/components/ui/Sidebar";
import Brain3DWrapper from "@/components/dashboard/Brain3DWrapper";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="relative flex-1 overflow-y-auto p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-palace-mid/20 via-transparent to-palace-primary/10" />
        <Brain3DWrapper />
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}
