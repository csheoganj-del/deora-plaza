import { Handshake } from "lucide-react"
import DepartmentSettlementList from "@/components/settlements/DepartmentSettlementList"

export default function DepartmentSettlementsPage() {
    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Department Settlements</h2>
                    <p className="text-muted-foreground">
                        Settle orders between the Bar/Hotel and the Restaurant.
                    </p>
                </div>
            </div>
            <DepartmentSettlementList />
        </div>
    )
}
