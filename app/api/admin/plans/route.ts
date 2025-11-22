import { NextRequest, NextResponse } from "next/server"
import { checkAdmin } from "@/lib/admin-auth"

// Plan limits configuration
// In production, store this in a database
let planLimits = {
  free: {
    jingles: 1,
    coverArts: 1,
    jinglePositions: ["start"],
    volumeControl: false,
    fullExport: false,
    previewDuration: 30,
    bandwidthLimit: 100 * 1024 * 1024, // 100MB
  },
  pro: {
    jingles: Infinity,
    coverArts: Infinity,
    jinglePositions: ["start", "middle", "end"],
    volumeControl: true,
    fullExport: true,
    previewDuration: null,
    bandwidthLimit: Infinity,
  },
}

export async function GET() {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json(planLimits)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const adminCheck = await checkAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await request.json()
    const { plan, limits } = body

    if (!plan || !limits) {
      return NextResponse.json(
        { error: "plan and limits are required" },
        { status: 400 }
      )
    }

    if (plan === "free" || plan === "pro") {
      const planKey = plan as "free" | "pro"
      planLimits[planKey] = { ...planLimits[planKey], ...limits }
      return NextResponse.json(planLimits)
    }

    return NextResponse.json(
      { error: "Invalid plan" },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Unauthorized" },
      { status: error.message?.includes("Unauthorized") ? 401 : 500 }
    )
  }
}

