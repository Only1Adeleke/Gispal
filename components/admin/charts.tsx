"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from "recharts"

interface AdminChartsProps {
  users: any[]
  mixes: any[]
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export function AdminCharts({ users, mixes }: AdminChartsProps) {
  // Prepare data for monthly mixes
  const monthlyMixes = React.useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        mixes: 0,
      }
    })

    mixes.forEach((mix: any) => {
      const date = new Date(mix.createdAt)
      const monthIndex = date.getMonth()
      const currentMonth = new Date().getMonth()
      const diff = currentMonth - monthIndex
      if (diff >= 0 && diff < 12) {
        months[11 - diff].mixes += 1
      }
    })

    return months
  }, [mixes])

  // Prepare data for user growth
  const userGrowth = React.useMemo(() => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date()
      date.setMonth(date.getMonth() - (11 - i))
      return {
        month: date.toLocaleDateString("en-US", { month: "short" }),
        users: 0,
      }
    })

    users.forEach((user: any) => {
      const date = new Date(user.createdAt)
      const monthIndex = date.getMonth()
      const currentMonth = new Date().getMonth()
      const diff = currentMonth - monthIndex
      if (diff >= 0 && diff < 12) {
        months[11 - diff].users += 1
      }
    })

    // Cumulative
    let cumulative = 0
    return months.map((m) => {
      cumulative += m.users
      return { ...m, users: cumulative }
    })
  }, [users])

  // Plan distribution
  const planDistribution = React.useMemo(() => {
    const free = users.filter((u: any) => u.plan === "free").length
    const pro = users.filter((u: any) => u.plan !== "free").length
    return [
      { name: "Free", value: free },
      { name: "Pro", value: pro },
    ]
  }, [users])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Monthly Mixes Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Mixes</CardTitle>
          <CardDescription>Number of mixes created per month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyMixes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="mixes" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* User Growth Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>User Growth</CardTitle>
          <CardDescription>Cumulative user registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="users" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Plan Distribution Pie Chart */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Plan Distribution</CardTitle>
          <CardDescription>Free vs Pro users</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {planDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

