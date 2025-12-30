/**
 * React hook for API key management using React Query
 * Provides optimized data fetching, caching, and mutations
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

export interface ApiKey {
  id: string
  name: string
  prefix?: string
  scopes: string[]
  createdAt: Date | string
  updatedAt: Date | string
  lastUsedAt: Date | string | null
  expiresAt: Date | string | null
  revokedAt: Date | string | null
  usageCount?: number
  rateLimitPerMinute: number
  rateLimitPerDay: number
  status: "active" | "revoked" | "expired"
  userId?: string
}

export interface ApiKeyUsage {
  range?: string
  today: number
  thisMonth: number
  total: number
  success: number
  errors: number
  avgLatency?: number
  callsPerHour?: Array<{ hour: number; count: number }>
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

/**
 * Fetch API keys
 */
async function fetchApiKeys(): Promise<ApiKey[]> {
  const response = await fetch("/api/keys")
  if (!response.ok) {
    throw new Error("Failed to fetch API keys")
  }
  const data = await response.json()
  return data.keys || []
}

/**
 * Create API key
 */
async function createApiKey(data: CreateApiKeyData): Promise<{ key: string; apiKey: ApiKey }> {
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
  return { key: result.key, apiKey: result }
}

/**
 * Update API key
 */
async function updateApiKey(id: string, data: UpdateApiKeyData): Promise<ApiKey> {
  const response = await fetch(`/api/keys/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to update API key")
  }

  return await response.json()
}

/**
 * Revoke API key
 */
async function revokeApiKey(id: string): Promise<void> {
  const response = await fetch(`/api/keys/${id}`, {
    method: "DELETE",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to revoke API key")
  }
}

/**
 * Rotate API key
 */
async function rotateApiKey(id: string): Promise<{ key: string; apiKey: ApiKey }> {
  const response = await fetch(`/api/keys/${id}/rotate`, {
    method: "POST",
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to rotate API key")
  }

  const result = await response.json()
  return { key: result.key, apiKey: result }
}

/**
 * Fetch usage statistics
 */
async function fetchUsage(id: string): Promise<ApiKeyUsage> {
  const response = await fetch(`/api/keys/${id}/usage`)
  if (!response.ok) {
    throw new Error("Failed to fetch usage")
  }
  return await response.json()
}

/**
 * React Query hook for API key management
 */
export function useApiKeys() {
  const queryClient = useQueryClient()

  // Query for API keys
  const {
    data: keys = [],
    isLoading: loading,
    error,
    refetch: fetchKeys,
  } = useQuery({
    queryKey: ["apiKeys"],
    queryFn: fetchApiKeys,
    staleTime: 30 * 1000, // 30 seconds
  })

  // Mutation for creating API key
  const createMutation = useMutation({
    mutationFn: createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
      toast.success("API key created", { description: "Save the key now - you won't see it again!" })
    },
    onError: (error: Error) => {
      toast.error("Failed to create API key", { description: error.message })
    },
  })

  // Mutation for updating API key
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateApiKeyData }) => updateApiKey(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
      toast.success("API key updated")
    },
    onError: (error: Error) => {
      toast.error("Failed to update API key", { description: error.message })
    },
  })

  // Mutation for revoking API key
  const revokeMutation = useMutation({
    mutationFn: revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
      toast.success("API key revoked")
    },
    onError: (error: Error) => {
      toast.error("Failed to revoke API key", { description: error.message })
    },
  })

  // Mutation for rotating API key
  const rotateMutation = useMutation({
    mutationFn: rotateApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys"] })
      toast.success("API key rotated", { description: "Save the new key now - you won't see it again!" })
    },
    onError: (error: Error) => {
      toast.error("Failed to rotate API key", { description: error.message })
    },
  })

  // Query for usage statistics
  const useUsage = (id: string) => {
    return useQuery({
      queryKey: ["apiKeyUsage", id],
      queryFn: () => fetchUsage(id),
      enabled: !!id,
      staleTime: 60 * 1000, // 1 minute
    })
  }

  return {
    keys,
    loading,
    error,
    fetchKeys,
    createKey: createMutation.mutateAsync,
    updateKey: (id: string, data: UpdateApiKeyData) => updateMutation.mutateAsync({ id, data }),
    revokeKey: revokeMutation.mutateAsync,
    rotateKey: rotateMutation.mutateAsync,
    getUsage: fetchUsage,
    useUsage,
  }
}
