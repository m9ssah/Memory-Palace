import Sidebar from "@/components/ui/Sidebar";

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
        <div className="relative">{children}</div>
      </main>
    </div>
  );
}
