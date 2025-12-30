"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import type { UsageChartData } from "@/lib/server/dashboard"

interface UsageChartContentProps {
  data: UsageChartData[]
}

export function UsageChartContent({ data }: UsageChartContentProps) {
  // Format data for chart
  const chartData = data.map((item) => {
    // Handle different date formats (SQLite returns string, Postgres might return Date)
    let dateObj: Date
    if (typeof item.date === "string") {
      // Try parsing as ISO or unix timestamp
      dateObj = new Date(item.date)
      if (isNaN(dateObj.getTime())) {
        // Might be a date string from SQLite
        dateObj = new Date(parseInt(item.date) * 1000)
      }
    } else {
      dateObj = item.date as Date
    }
    
    return {
      date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: item.count,
    }
  })

  // Fill in missing dates with 0
  const filledData = chartData.length > 0 ? chartData : [{ date: "No data", count: 0 }]

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={filledData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="date"
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <YAxis
          className="text-xs"
          tick={{ fill: "hsl(var(--muted-foreground))" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "calc(var(--radius) - 2px)",
          }}
          labelStyle={{ color: "hsl(var(--foreground))" }}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 4, fill: "hsl(var(--primary))" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

