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
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgba(122,67,252,0.15),transparent_50%),radial-gradient(ellipse_at_80%_80%,rgba(211,193,255,0.3),transparent_50%),linear-gradient(160deg,#D3C1FF_0%,#E0D4F5_25%,#EDE4F7_50%,#E0D4F5_75%,#D3C1FF_100%)]" />
        <Brain3DWrapper />
        <div className="relative z-10">{children}</div>
      </main>
    </div>
  );
}
