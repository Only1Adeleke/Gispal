"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Download,
  Key,
  BarChart3,
  CreditCard,
  Shield,
  Library,
  Upload,
  ExternalLink,
  Music,
  Image,
  Sliders,
  History,
  Settings,
  User,
  BookOpen,
  LifeBuoy,
  Command,
  Users,
  Receipt,
  FileText,
} from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const primaryNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    isActive: false,
  },
  {
    title: "API Keys",
    url: "/dashboard/api-keys",
    icon: Key,
    isActive: false,
    items: [
      {
        title: "All Keys",
        url: "/dashboard/api-keys",
      },
      {
        title: "Usage Analytics",
        url: "/dashboard/analytics",
      },
    ],
  },
  {
    title: "Downloads",
    url: "/dashboard/downloads",
    icon: Download,
    isActive: false,
  },
  {
    title: "Billing",
    url: "/dashboard/billing",
    icon: CreditCard,
    isActive: false,
  },
]

const secondaryNav = [
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
  {
    title: "Docs",
    url: "/docs",
    icon: BookOpen,
  },
  {
    title: "Support",
    url: "/support",
    icon: LifeBuoy,
  },
]

const adminNav = [
  {
    title: "Admin Dashboard",
    url: "/admin",
    icon: Shield,
    isActive: false,
    items: [
      {
        title: "API Keys",
        url: "/admin/api-keys",
      },
      {
        title: "Users",
        url: "/admin/users",
      },
      {
        title: "Payments",
        url: "/admin/payments",
      },
      {
        title: "System Logs",
        url: "/admin/logs",
      },
    ],
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
  }
  isAdmin?: boolean
}

export function AppSidebarModern({ user, isAdmin = false, ...props }: AppSidebarProps) {
  const pathname = usePathname()

  // Update active states based on pathname
  const navWithActive = primaryNav.map((item) => ({
    ...item,
    isActive: pathname === item.url || (item.url !== "/dashboard" && pathname?.startsWith(item.url)),
  }))

  const adminNavWithActive = adminNav.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname?.startsWith(item.url),
  }))

  const defaultUser = user || {
    name: "User",
    email: "user@example.com",
    avatar: undefined,
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Command className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Gispal</span>
                  <span className="truncate text-xs text-sidebar-foreground/70">Audio Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navWithActive} />
        {isAdmin && <NavMain items={adminNavWithActive} />}
        <NavSecondary items={secondaryNav} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={defaultUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

