"use client"

import { useState, useEffect } from "react"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { getDailySettlementReport } from "@/actions/departmentSettlements"

interface DepartmentSummary {
  total: number
  paid: number
  pending: number
  orderCount: number
  paidOrderCount: number
}

interface SettlementReport {
  date: string
  summary: Record<string, DepartmentSummary>
  grandTotal: number
  grandPaid: number
  grandPending: number
}

export default function SettlementReport({ date }: { date?: Date }) {
  const [report, setReport] = useState<SettlementReport | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const data = await getDailySettlementReport(date)
      setReport(data)
    } catch (error) {
      console.error("Error fetching settlement report:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [date])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="premium-card">
        <div className="p-8 border-b border-[#E5E7EB]">
          <h2 className="text-3xl font-bold text-[#111827]">Settlement Report</h2>
        </div>
        <div className="p-8">
          <p className="text-muted-foreground text-center py-8">
            No settlement report available.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-card">
      <div className="p-8 border-b border-[#E5E7EB]">
        <h2 className="text-3xl font-bold text-[#111827]">Daily Settlement Report</h2>
        <p className="text-sm text-muted-foreground">
          Date: {new Date(report.date).toLocaleDateString('en-IN')}
        </p>
      </div>
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Total Revenue</h3>
            <p className="text-2xl font-bold">₹{report.grandTotal.toLocaleString('en-IN')}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Paid Amount</h3>
            <p className="text-2xl font-bold text-[#22C55E]">₹{report.grandPaid.toLocaleString('en-IN')}</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-sm text-muted-foreground">Pending Amount</h3>
            <p className="text-2xl font-bold text-orange-600">₹{report.grandPending.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <h3 className="font-semibold mb-3">Department Breakdown</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Paid</TableHead>
              <TableHead className="text-right">Pending</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Paid Orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(report.summary).map(([dept, summary]) => (
              <TableRow key={dept}>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {dept}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">
                  ₹{summary.total.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right text-[#22C55E]">
                  ₹{summary.paid.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right text-orange-600">
                  ₹{summary.pending.toLocaleString('en-IN')}
                </TableCell>
                <TableCell className="text-right">
                  {summary.orderCount}
                </TableCell>
                <TableCell className="text-right">
                  {summary.paidOrderCount}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="mt-6 pt-4 border-t">
          <h3 className="font-semibold mb-3">Inter-Departmental Settlements</h3>
          <p className="text-sm text-muted-foreground">
            Revenue transfers between departments are automatically processed during daily settlement.
          </p>
        </div>
      </div>
    </div>
  )
}

