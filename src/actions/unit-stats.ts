"use server";

export interface UnitMetrics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  activeTablesCount: number;
}

export async function getUnitMetrics(
  unit: string,
  startDate?: string,
  endDate?: string
): Promise<UnitMetrics> {
  try {
    return {
      totalRevenue: 12500,
      totalOrders: 42,
      averageOrderValue: 297,
      activeTablesCount: 6,
    };
  } catch (error) {
    console.error("Error getting unit metrics:", error);
    return {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      activeTablesCount: 0,
    };
  }
}

export async function getUnitDailyReport(
  date?: string,
  businessUnit?: string
) {
  try {
    return {
      date: date || new Date().toISOString().split("T")[0],
      period: "Today",
      businessUnit: businessUnit || "all",
      summary: {
        totalRevenue: 45000,
        totalOrders: 120,
        totalCustomers: 95,
        avgOrderValue: 375,
      },
    };
  } catch (error) {
    console.error("Error getting daily report:", error);
    return null;
  }
}
