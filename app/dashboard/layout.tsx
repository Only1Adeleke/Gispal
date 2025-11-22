import dynamic from "next/dynamic"

// Dynamic import for client component
const Sidebar = dynamic(() => import("@/components/dashboard/sidebar").then(mod => ({ default: mod.Sidebar })), {
  ssr: false,
})

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}

