import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { markDeviceSeen } from "@/actions/user-management"

export async function POST(req: Request) {
  try {
    const { success, user } = await verifyAuth(req)
    const body = await req.json()
    const platform = body.platform as "android" | "ios" | "web"

    if (!platform) {
      return NextResponse.json({ success: false, error: "Missing platform" }, { status: 400 })
    }

    if (!success || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const result = await markDeviceSeen(user.id, platform)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

