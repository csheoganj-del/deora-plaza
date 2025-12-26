import { NextResponse } from "next/server"
import { verifyAuth } from "@/lib/auth"
import { updateDeviceLocation } from "@/actions/user-management"

export async function POST(req: Request) {
  try {
    const { success, user } = await verifyAuth(req)
    const body = await req.json()
    const platform = body.platform as "android" | "ios" | "web"
    const location = body.location as { lat: number; lon: number; accuracy?: number; city?: string; region?: string; country?: string }

    if (!platform || !location || typeof location.lat !== 'number' || typeof location.lon !== 'number') {
      return NextResponse.json({ success: false, error: "Missing platform or location" }, { status: 400 })
    }

    if (!success || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // If city is not provided, try lightweight reverse geocoding via OpenStreetMap Nominatim
    let enriched = { ...location }
    try {
      if (!location.city && typeof location.lat === 'number' && typeof location.lon === 'number') {
        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lon}`
        const res = await fetch(url, { headers: { 'User-Agent': 'DeoraPlaza/1.0 (contact@example.com)' } })
        if (res.ok) {
          const data = await res.json()
          const addr = data?.address || {}
          enriched = {
            ...enriched,
            city: addr.city || addr.town || addr.village || addr.hamlet,
            region: addr.state || addr.county,
            country: addr.country
          }
        }
      }
    } catch {}

    const result = await updateDeviceLocation(user.id, platform, enriched)
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

