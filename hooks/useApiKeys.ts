/**
 * React hook for API key management
 */

import { useState, useEffect } from "react"
import { toast } from "sonner"

export interface ApiKey {
  id: string
  name: string
  scopes: string[]
  createdAt: Date | string
  updatedAt: Date | string
  lastUsedAt: Date | string | null
  expiresAt: Date | string | null
  revokedAt: Date | string | null
  rateLimitPerMinute: number
  rateLimitPerDay: number
  status: "active" | "revoked" | "expired"
  userId?: string
}

export interface ApiKeyUsage {
  today: number
  thisMonth: number
  total: number
  success: number
  errors: number
  topRoutes: Array<{ route: string; count: number }>
}

export interface CreateApiKeyData {
  name: string
  scopes?: string[]
  expiresAt?: string
  rateLimitPerMinute?: number
  rateLimitPerDay?: number
}

export interface UpdateApiKeyData {
  name?: string
  scopes?: string[]
  expiresAt?: string | null
  rateLimitPerMinute?: number
  rateLimitPerDay?: number
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)

  const fetchKeys = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/keys")
      if (!response.ok) {
        throw new Error("Failed to fetch API keys")
      }
      const data = await response.json()
      setKeys(data.keys || [])
    } catch (error: any) {
      toast.error("Failed to load API keys", { description: error.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

  const createKey = async (data: CreateApiKeyData): Promise<{ key: string; apiKey: ApiKey } | null> => {
    try {
      const response = await fetch("/api/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to create API key")
      }

      const result = await response.json()
      await fetchKeys()
      toast.success("API key created", { description: "Save the key now - you won't see it again!" })
      return { key: result.key, apiKey: result }
    } catch (error: any) {
      toast.error("Failed to create API key", { description: error.message })
      return null
    }
  }

  const updateKey = async (id: string, data: UpdateApiKeyData): Promise<boolean> => {
    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to update API key")
      }

      await fetchKeys()
      toast.success("API key updated")
      return true
    } catch (error: any) {
      toast.error("Failed to update API key", { description: error.message })
      return false
    }
  }

  const revokeKey = async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/keys/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to revoke API key")
      }

      await fetchKeys()
      toast.success("API key revoked")
      return true
    } catch (error: any) {
      toast.error("Failed to revoke API key", { description: error.message })
      return false
    }
  }

  const rotateKey = async (id: string): Promise<{ key: string; apiKey: ApiKey } | null> => {
    try {
      const response = await fetch(`/api/keys/${id}/rotate`, {
        method: "POST",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Failed to rotate API key")
      }

      const result = await response.json()
      await fetchKeys()
      toast.success("API key rotated", { description: "Save the new key now - you won't see it again!" })
      return { key: result.key, apiKey: result }
    } catch (error: any) {
      toast.error("Failed to rotate API key", { description: error.message })
      return null
    }
  }

  const getUsage = async (id: string): Promise<ApiKeyUsage | null> => {
    try {
      const response = await fetch(`/api/keys/${id}/usage`)
      if (!response.ok) {
        throw new Error("Failed to fetch usage")
      }
      return await response.json()
    } catch (error: any) {
      toast.error("Failed to load usage", { description: error.message })
      return null
    }
  }

  return {
    keys,
    loading,
    fetchKeys,
    createKey,
    updateKey,
    revokeKey,
    rotateKey,
    getUsage,
  }
}

