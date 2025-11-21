"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Clock, AlertCircle } from "lucide-react"
import { toast } from "sonner"

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
        <h1 className="text-3xl font-bold">History</h1>
        <p className="text-gray-600 mt-2">View your previous mixes and previews</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mix History</CardTitle>
          <CardDescription>All your processed audio files</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : mixes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No mixes yet.</p>
              <p className="text-sm mt-2">Create your first mix in the Mixer page.</p>
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

