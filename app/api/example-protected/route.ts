/**
 * Example protected API route using API key authentication
 * This demonstrates how to use the validateApiKey middleware
 */

import { NextRequest, NextResponse } from "next/server"
import { validateApiKey } from "@/lib/api/middleware/validateApiKey"
import { API_SCOPES } from "@/lib/api-keys/utils"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Example endpoint that requires API key authentication
 * Requires: audio:ingest scope
 */
export async function GET(request: NextRequest) {
  // Validate API key with required scopes
  const validation = await validateApiKey(request, [API_SCOPES.AUDIO_INGEST])

  if (!validation.success) {
    return validation.response
  }

  // Access the authenticated user and API key from context
  const { authorizedUser, apiKey } = validation.context

  return NextResponse.json({
    message: "This is a protected endpoint",
    user: {
      id: authorizedUser.id,
      email: authorizedUser.email,
    },
    apiKey: {
      id: apiKey.id,
      name: apiKey.name,
      scopes: apiKey.scopes,
    },
  })
}

