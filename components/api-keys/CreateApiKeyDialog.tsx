"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApiKeys, type CreateApiKeyData } from "@/hooks/useApiKeys"
import { ALL_SCOPES } from "@/lib/api-keys/utils"
import { Checkbox } from "@/components/ui/checkbox"

interface CreateApiKeyDialogProps {
  onKeyCreated?: (key: string) => void
}

export function CreateApiKeyDialog({ onKeyCreated }: CreateApiKeyDialogProps) {
  const { createKey } = useApiKeys()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CreateApiKeyData>({
    name: "",
    scopes: [],
    rateLimitPerMinute: 60,
    rateLimitPerDay: 5000,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await createKey(formData)
      if (result) {
        setOpen(false)
        setFormData({
          name: "",
          scopes: [],
          rateLimitPerMinute: 60,
          rateLimitPerDay: 5000,
        })
        if (onKeyCreated) {
          onKeyCreated(result.key)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleScope = (scope: string) => {
    const scopes = formData.scopes || []
    if (scopes.includes(scope)) {
      setFormData({ ...formData, scopes: scopes.filter((s) => s !== scope) })
    } else {
      setFormData({ ...formData, scopes: [...scopes, scope] })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New API Key</DialogTitle>
          <DialogDescription>
            Create a new API key for programmatic access. You&apos;ll see the key once after creation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My API Key"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Scopes</Label>
            <div className="grid grid-cols-2 gap-2 border rounded-md p-4">
              {ALL_SCOPES.map((scope) => (
                <div key={scope} className="flex items-center space-x-2">
                  <Checkbox
                    id={scope}
                    checked={(formData.scopes || []).includes(scope)}
                    onCheckedChange={() => toggleScope(scope)}
                  />
                  <Label
                    htmlFor={scope}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {scope}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="rateLimitPerMinute">Rate Limit (per minute)</Label>
              <Input
                id="rateLimitPerMinute"
                type="number"
                min="1"
                max="10000"
                value={formData.rateLimitPerMinute}
                onChange={(e) =>
                  setFormData({ ...formData, rateLimitPerMinute: parseInt(e.target.value) || 60 })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rateLimitPerDay">Rate Limit (per day)</Label>
              <Input
                id="rateLimitPerDay"
                type="number"
                min="1"
                max="1000000"
                value={formData.rateLimitPerDay}
                onChange={(e) =>
                  setFormData({ ...formData, rateLimitPerDay: parseInt(e.target.value) || 5000 })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? "Creating..." : "Create Key"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

