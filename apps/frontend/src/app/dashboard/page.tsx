import Navbar from "@/components/layout/Navbar";
import AuthGuard from "@/components/providers/AuthGuard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="w-full min-h-screen flex flex-col">
        <Navbar />
        <div className="w-full min-h-[calc(100dvh-var(--navbar-height))] flex items-center justify-center">
          <h1 className="text-2xl font-semibold text-[#111827]">Dashboard</h1>
        </div>
      </div>
    </AuthGuard>
  );
}
