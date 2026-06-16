import Navbar from '@/components/layout/Navbar'
import AuthGuard from '@/components/providers/AuthGuard'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <div className="w-full min-h-screen flex flex-col">
        <Navbar />
        <main className="w-full min-h-[calc(100dvh-var(--navbar-height))]">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
