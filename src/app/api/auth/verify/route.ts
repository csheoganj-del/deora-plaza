import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "deora-plaza-secret-key-change-in-production"
);

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("deora-auth-token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    // Verify the JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return NextResponse.json({ 
      success: true, 
      user: {
        id: payload.userId,
        role: payload.role,
        businessUnit: payload.businessUnit
      }
    });
  } catch (error) {
    console.error("Token verification failed:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}