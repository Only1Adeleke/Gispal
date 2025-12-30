"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
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
  LogOut,
} from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

interface NavItem {
  title: string
  url: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

interface NavSection {
  title?: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    items: [
      {
        title: "Overview",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Downloads",
    items: [
      {
        title: "Downloads",
        url: "/dashboard/downloads",
        icon: Download,
      },
    ],
  },
  {
    title: "API & Integration",
    items: [
      {
        title: "API Keys",
        url: "/dashboard/api-keys",
        icon: Key,
      },
      {
        title: "Usage Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        title: "Billing",
        url: "/dashboard/billing",
        icon: CreditCard,
      },
    ],
  },
  {
    title: "Library",
    items: [
      {
        title: "Library",
        url: "/dashboard/library",
        icon: Library,
      },
      {
        title: "Upload",
        url: "/dashboard/upload",
        icon: Upload,
      },
      {
        title: "External Audio",
        url: "/dashboard/upload-external",
        icon: ExternalLink,
      },
    ],
  },
  {
    title: "Audio Tools",
    items: [
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
        title: "Mixer",
        url: "/dashboard/mixer",
        icon: Sliders,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        title: "History",
        url: "/dashboard/history",
        icon: History,
      },
      {
        title: "Settings",
        url: "/dashboard/settings",
        icon: Settings,
      },
      {
        title: "Account",
        url: "/dashboard/account",
        icon: User,
      },
    ],
  },
]

const adminSection: NavSection = {
  title: "Admin",
  items: [
    {
      title: "API Keys",
      url: "/admin/api-keys",
      icon: Shield,
    },
  ],
}

export function AppSidebar() {
  const pathname = usePathname()
  
  // Check admin status
  const { data: isAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const res = await fetch("/api/auth/check-admin")
      if (!res.ok) return false
      const data = await res.json()
      return data.isAdmin
    },
    staleTime: 5 * 60 * 1000,
  })

  const handleLogout = async () => {
    const { signOut } = await import("@/lib/auth-client")
    await signOut()
    window.location.href = "/login"
  }

  return (
    <div className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar-background text-sidebar-foreground">
      {/* Header */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Gispal
          </h1>
          <p className="text-xs text-muted-foreground">Audio Platform</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-6">
          {navSections.map((section, sectionIdx) => (
            <div key={sectionIdx} className="space-y-1">
              {section.title && (
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.url || (item.url !== "/dashboard" && pathname?.startsWith(item.url))
                
                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                      "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                        : "text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.title}</span>
                    {item.badge && (
                      <span className="ml-auto rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-semibold text-sidebar-primary-foreground">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}

          {/* Admin Section - Role Gated */}
          {isAdmin && (
            <>
              <Separator className="bg-sidebar-border" />
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {adminSection.title}
                </div>
                {adminSection.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.url || pathname?.startsWith(item.url)
                  
                  return (
                    <Link
                      key={item.url}
                      href={item.url}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  )
                })}
              </div>
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4 space-y-2">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span className="text-sm">Logout</span>
        </Button>
      </div>
    </div>
  )
}

