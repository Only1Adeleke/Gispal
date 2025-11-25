"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Music,
  Image,
  Sliders,
  CreditCard,
  Settings,
  LogOut,
  History,
  User,
  Library,
  Upload,
  ExternalLink,
  Key,
  BarChart3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const mainNavItems = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
]

const libraryNavItems = [
  { href: "/dashboard/library", label: "Library", icon: Library },
  { href: "/dashboard/upload", label: "Upload", icon: Upload },
  { href: "/dashboard/upload-external", label: "External Audio", icon: ExternalLink },
]

const audioNavItems = [
  { href: "/dashboard/jingles", label: "Jingles", icon: Music },
  { href: "/dashboard/cover-art", label: "Cover Art", icon: Image },
  { href: "/dashboard/mixer", label: "Mixer", icon: Sliders },
]

const accountNavItems = [
  { href: "/dashboard/billing", label: "Billing & Usage", icon: CreditCard },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/account", label: "Account", icon: User },
]

export function Sidebar() {
  const pathname = usePathname()

  const handleLogout = async () => {
    const { signOut } = await import("@/lib/auth-client")
    await signOut()
    window.location.href = "/login"
  }

  const renderNavGroup = (items: typeof mainNavItems, groupLabel?: string) => {
    return (
      <div className="space-y-1">
        {groupLabel && (
          <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {groupLabel}
          </div>
        )}
        {items.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    )
  }

  return (
    <aside className="w-64 bg-sidebar-background text-sidebar-foreground min-h-screen border-r border-sidebar-border flex flex-col shrink-0 z-10 fixed left-0 top-0">
      <div className="p-6 border-b border-sidebar-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Gispal
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Audio Mixing Platform</p>
      </div>
      
      <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
        {renderNavGroup(mainNavItems)}
        
        <Separator className="bg-sidebar-border" />
        
        {renderNavGroup(libraryNavItems, "Library")}
        
        <Separator className="bg-sidebar-border" />
        
        {renderNavGroup(audioNavItems, "Audio Tools")}
        
        <Separator className="bg-sidebar-border" />
        
        {renderNavGroup(accountNavItems, "Account")}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          <span className="text-sm font-medium">Logout</span>
        </Button>
      </div>
    </aside>
  )
}

