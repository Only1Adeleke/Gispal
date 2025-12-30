import { redirect } from "next/navigation"
import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { isAdmin } from "@/lib/api/middleware/adminGuard"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminSidebarWrapper } from "@/components/dashboard/admin-sidebar-wrapper"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const session = await auth.api.getSession({ headers: headersList })

  if (!session || !session.user) {
    redirect("/login")
  }

  const userIsAdmin = await isAdmin(session.user.id)

  if (!userIsAdmin) {
    redirect("/dashboard")
  }

  return (
    <SidebarProvider>
      <AdminSidebarWrapper />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-zinc-800/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col gap-6 p-6">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
