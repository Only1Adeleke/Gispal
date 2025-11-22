"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Clock, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

interface Mix {
  id: string
  audioUrl: string
  outputUrl: string
  isPreview: boolean
  createdAt: string
  expiresAt?: string
}

export default function HistoryPage() {
  const [mixes, setMixes] = useState<Mix[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      // In production, this would fetch from /api/mixes or similar
      // For now, we'll use a placeholder
      setMixes([])
    } catch (error) {
      toast.error("Failed to fetch history")
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getTimeRemaining = (expiresAt?: string) => {
    if (!expiresAt) return null
    const now = new Date().getTime()
    const expires = new Date(expiresAt).getTime()
    const diff = expires - now
    if (diff <= 0) return "Expired"
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    return `${minutes}m ${seconds}s`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">History</h1>
        <p className="text-muted-foreground mt-1.5">View your previous mixes and previews</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mix History</CardTitle>
          <CardDescription>All your processed audio files</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : mixes.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No mixes yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first mix in the Mixer page
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mixes.map((mix) => {
                  const timeRemaining = getTimeRemaining(mix.expiresAt)
                  const isExpired = timeRemaining === "Expired"

                  return (
                    <TableRow key={mix.id}>
                      <TableCell>
                        <Badge variant={mix.isPreview ? "secondary" : "default"}>
                          {mix.isPreview ? "Preview" : "Full Export"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(mix.createdAt)}</TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {mix.isPreview && mix.expiresAt ? (
                          <div className="flex items-center gap-2">
                            {isExpired ? (
                              <>
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="text-red-600">Expired</span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-amber-600">{timeRemaining}</span>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Permanent</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {!isExpired && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                          >
                            <a href={mix.outputUrl} download>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

