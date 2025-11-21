import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { requireAdmin } from "@/lib/admin-auth"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Check admin access - this will redirect if not admin
  try {
    await requireAdmin()
  } catch (error) {
    // requireAdmin() throws redirect, so this should not be reached
    // But if it does, redirect to dashboard
    redirect("/dashboard")
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}

