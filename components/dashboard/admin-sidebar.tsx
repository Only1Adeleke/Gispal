"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Activity,
  FileText,
  Users,
  Key,
  Eye,
  CreditCard,
  Receipt,
  Package,
  Gauge,
  ToggleLeft,
  HardDrive,
  Shield,
  Command,
} from "lucide-react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

const systemNav = [
  {
    title: "Admin Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "System Health",
    url: "/admin/health",
    icon: Activity,
  },
  {
    title: "System Logs",
    url: "/admin/logs",
    icon: FileText,
  },
]

const usersNav = [
  {
    title: "Users",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "API Keys (Global)",
    url: "/admin/api-keys",
    icon: Key,
  },
  {
    title: "API Oversight",
    url: "/admin/api-oversight",
    icon: Eye,
  },
]

const revenueNav = [
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Payments",
    url: "/admin/payments",
    icon: Receipt,
  },
  {
    title: "Plan Management",
    url: "/admin/plans",
    icon: Package,
  },
]

const controlsNav = [
  {
    title: "Rate Limits",
    url: "/admin/rate-limits",
    icon: Gauge,
  },
  {
    title: "Feature Flags",
    url: "/admin/features",
    icon: ToggleLeft,
  },
  {
    title: "Storage Usage",
    url: "/admin/storage",
    icon: HardDrive,
  },
]

export function AdminSidebar({ user, ...props }: AdminSidebarProps) {
  const pathname = usePathname()

  const defaultUser = user || {
    name: "Admin",
    email: "admin@example.com",
    avatar: undefined,
  }

  // Helper to add active state
  const addActiveState = (items: typeof systemNav) =>
    items.map((item) => ({
      ...item,
      isActive: pathname === item.url || pathname?.startsWith(item.url),
    }))

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/20">
                  <Shield className="size-4 text-red-400" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Admin</span>
                  <span className="truncate text-xs text-zinc-500">Operations</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* System */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            System
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={addActiveState(systemNav)} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Users & Access */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Users & Access
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={addActiveState(usersNav)} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Revenue */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Revenue
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={addActiveState(revenueNav)} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Controls */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Controls
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={addActiveState(controlsNav)} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={defaultUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

