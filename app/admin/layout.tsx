import dynamic from "next/dynamic"
import { requireAdmin } from "@/lib/admin-auth"

// Dynamic import for client component
const AdminSidebar = dynamic(() => import("@/components/admin/admin-sidebar").then(mod => ({ default: mod.AdminSidebar })), {
  ssr: false,
})

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check admin access - this will redirect if not admin
  // requireAdmin() throws redirect() which Next.js handles automatically
  await requireAdmin()

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}

