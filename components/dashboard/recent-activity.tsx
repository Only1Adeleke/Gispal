"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Activity, CheckCircle2, XCircle, Key, RotateCcw, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityItem {
  id: string
  type: "api_call" | "key_created" | "key_rotated" | "key_revoked"
  description: string
  timestamp: Date | string
  status?: "success" | "error"
}

interface RecentActivityProps {
  activities: ActivityItem[]
}

const typeIcons = {
  api_call: Activity,
  key_created: Key,
  key_rotated: RotateCcw,
  key_revoked: Trash2,
}

const typeLabels = {
  api_call: "API Call",
  key_created: "Key Created",
  key_rotated: "Key Rotated",
  key_revoked: "Key Revoked",
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return null // Empty state handled by parent
  }

  return (
    <div className="rounded-lg border border-zinc-800/50 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-zinc-800/50 hover:bg-transparent">
            <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Action
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Resource
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500">
              Status
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-wider text-zinc-500 text-right">
              Time
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {activities.map((activity, index) => {
            const Icon = typeIcons[activity.type]
            const isLast = index === activities.length - 1
            
            return (
              <TableRow
                key={activity.id}
                className={cn(
                  "border-zinc-800/50 transition-all duration-200",
                  "hover:bg-zinc-900/50 hover:border-zinc-700/50",
                  "group cursor-pointer",
                  !isLast && "border-b"
                )}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {Icon && (
                      <Icon className="h-3.5 w-3.5 text-zinc-500 group-hover:text-violet-400 transition-colors" />
                    )}
                    <Badge
                      variant="outline"
                      className="text-xs border-zinc-700/50 bg-zinc-900/30 text-zinc-400 group-hover:border-violet-500/30 group-hover:text-violet-300 transition-colors"
                    >
                      {typeLabels[activity.type]}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-zinc-300 group-hover:text-zinc-100 transition-colors">
                  {activity.description}
                </TableCell>
                <TableCell>
                  {activity.status ? (
                    <div className="flex items-center gap-1.5">
                      {activity.status === "success" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-400" />
                      )}
                      <Badge
                        variant={activity.status === "success" ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-600">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-xs text-zinc-500 group-hover:text-zinc-400 transition-colors">
                  {format(new Date(activity.timestamp), "MMM d, HH:mm")}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
