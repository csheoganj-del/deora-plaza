import { NextRequest, NextResponse } from "next/server";
import { getCurrentCustomUser } from "@/actions/custom-auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentCustomUser();
    const token = request.cookies.get("deora-auth-token")?.value;
    
    return NextResponse.json({
      hasToken: !!token,
      tokenLength: token?.length,
      tokenPreview: token?.substring(0, 30) + "...",
      user: user ? {
        id: user.userId,
        username: user.username,
        role: user.role
      } : null,
      timestamp: new Date().toISOString(),
      jwtSecret: process.env.JWT_SECRET ? "Set" : "Not set"
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}