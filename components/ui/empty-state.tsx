import { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-12 px-4 text-center", className)}>
      {icon && (
        <div className="mb-6 text-zinc-600 animate-pulse">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-3 text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-zinc-500 max-w-md mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <div className="transition-transform hover:scale-105 duration-200">
          {action}
        </div>
      )}
    </div>
  )
}

