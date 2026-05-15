import { Handshake, TrendingUp, IndianRupee } from "lucide-react"


import InterDepartmentalSettlement from "@/components/settlements/InterDepartmentalSettlement"
import DepartmentSettlementList from "@/components/settlements/DepartmentSettlementList"
import SettlementReport from "@/components/settlements/SettlementReport"

export default function SettlementsPage() {
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settlements</h2>
          <p className="text-muted-foreground">
            Manage department settlements and revenue tracking
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Today's Revenue</h2>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold">₹45,231</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from yesterday
            </p>
          </div>
        </div>
        
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Pending Settlements</h2>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold">₹12,450</div>
            <p className="text-xs text-muted-foreground">
              8 orders pending
            </p>
          </div>
        </div>
        
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">This Month</h2>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold">₹1,234,567</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </div>
        </div>
        
        <div className="premium-card">
          <div className="p-8 border-b border-[#E5E7EB] flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-3xl font-bold text-[#111827] text-sm font-medium">Settlement Rate</h2>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-8">
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              On time settlements
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        <SettlementReport />
        <InterDepartmentalSettlement />
        <DepartmentSettlementList />
      </div>
    </div>
  )
}

