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
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="glow-blob glow-blob-1" />
          <div className="glow-blob glow-blob-2" />
          <div className="glow-blob glow-blob-3" />
        </div>
        <div className="relative">{children}</div>
      </main>
    </div>
  );
}
