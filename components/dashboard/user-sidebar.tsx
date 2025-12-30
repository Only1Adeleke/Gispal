"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  BarChart3,
  History,
  Sliders,
  Music,
  Image,
  FileText,
  Key,
  Activity,
  Webhook,
  Plug,
  CreditCard,
  Receipt,
  Gauge,
  Settings,
  BookOpen,
  LifeBuoy,
  Command,
} from "lucide-react"
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

interface UserSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string
    email: string
    avatar?: string
  }
}

const platformNav = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Usage & Analytics",
    url: "/dashboard/analytics",
    icon: BarChart3,
  },
  {
    title: "Activity Logs",
    url: "/dashboard/activity",
    icon: History,
  },
]

const audioWorkflowsNav = [
  {
    title: "Mix Audio",
    url: "/dashboard/mix",
    icon: Sliders,
  },
  {
    title: "Jingles",
    url: "/dashboard/jingles",
    icon: Music,
  },
  {
    title: "Cover Art",
    url: "/dashboard/cover-art",
    icon: Image,
  },
  {
    title: "Metadata",
    url: "/dashboard/metadata",
    icon: FileText,
  },
]

const apiNav = [
  {
    title: "API Keys",
    url: "/dashboard/api-keys",
    icon: Key,
  },
  {
    title: "API Usage",
    url: "/dashboard/api-usage",
    icon: Activity,
  },
  {
    title: "Webhooks",
    url: "/dashboard/webhooks",
    icon: Webhook,
  },
  {
    title: "WordPress Plugin",
    url: "/dashboard/wordpress",
    icon: Plug,
  },
]

const billingNav = [
  {
    title: "Subscription",
    url: "/dashboard/billing",
    icon: CreditCard,
  },
  {
    title: "Payments",
    url: "/dashboard/payments",
    icon: Receipt,
  },
  {
    title: "Limits",
    url: "/dashboard/limits",
    icon: Gauge,
  },
]

const accountNav = [
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

export function UserSidebar({ user, ...props }: UserSidebarProps) {
  const pathname = usePathname()

  const defaultUser = user || {
    name: "User",
    email: "user@example.com",
    avatar: undefined,
  }

  // Helper to add active state
  const addActiveState = (items: typeof platformNav) =>
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
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20">
                  <Command className="size-4 text-violet-400" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Gispal</span>
                  <span className="truncate text-xs text-zinc-500">Audio Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Platform */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={addActiveState(platformNav)} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Audio Workflows */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Audio Workflows
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain
              items={addActiveState(audioWorkflowsNav).map((item) => ({
                ...item,
                badge: item.badge ? (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
                    {item.badge}
                  </Badge>
                ) : undefined,
              }))}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* API & Automation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            API & Automation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain
              items={addActiveState(apiNav).map((item) => ({
                ...item,
                badge: item.badge ? (
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
                    {item.badge}
                  </Badge>
                ) : undefined,
              }))}
            />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Billing */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Billing
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={addActiveState(billingNav)} />
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Account */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-zinc-500">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <NavSecondary items={addActiveState(accountNav)} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={defaultUser} />
      </SidebarFooter>
    </Sidebar>
  )
}

