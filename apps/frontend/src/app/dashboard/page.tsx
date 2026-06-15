import AuthGuard from "@/components/providers/AuthGuard";

export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-semibold text-[#111827]">Dashboard</h1>
      </div>
    </AuthGuard>
  );
}
