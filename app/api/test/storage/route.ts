import { NextResponse } from "next/server"
import { tempStorage } from "@/lib/storage"
import fs from "fs/promises"

export async function GET() {
  try {
    const testContent = Buffer.from("test file content")
    const filename = `test_${Date.now()}.txt`
    const filePath = await tempStorage.save(testContent, filename)

    // Verify file exists
    const exists = await fs.access(filePath).then(() => true).catch(() => false)

    // Clean up
    await tempStorage.delete(filename).catch(() => {})

    return NextResponse.json({
      success: true,
      message: "Storage test completed",
      filePath,
      exists,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Storage test failed" },
      { status: 500 }
    )
  }
}

