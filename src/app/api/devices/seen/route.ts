import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { adminAuth } from "@/lib/firebase/admin"
import { markDeviceSeen } from "@/actions/user-management"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any)
    const authHeader = req.headers.get("authorization")
    const body = await req.json()
    const platform = body.platform as "android" | "ios" | "web"

    if (!platform) {
      return NextResponse.json({ success: false, error: "Missing platform" }, { status: 400 })
    }

    let userId = session?.user?.id as string | undefined
    if (!userId && authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.slice(7)
      const decoded = await adminAuth.verifyIdToken(idToken)
      userId = decoded.uid
    }

    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const result = await markDeviceSeen(userId, platform)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
