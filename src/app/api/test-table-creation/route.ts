import { createTable } from "@/actions/tables";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test creating a table
    const result = await createTable({
      tableNumber: "API_TEST_001",
      businessUnit: "bar",
      capacity: 4
    });

    return NextResponse.json({
      success: true,
      message: "Table creation test completed",
      result
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Table creation test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

