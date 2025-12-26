import { requireAuth } from "@/lib/auth-helpers";
import { getTables } from "@/actions/tables";
import TableGrid from "@/components/tables/TableGrid";
import { TakeawayOrderButton } from "@/components/orders/TakeawayOrderButton";

export const dynamic = "force-dynamic";

export default async function BarTablesPage() {
    const session = await requireAuth();
    const userRole = session.user.role;
    const userBusinessUnit = session.user.businessUnit;

    // Filter tables to only show bar tables
    const barTables = await getTables("bar");

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Bar Tables</h2>
                <div className="flex items-center space-x-2">
                    <TakeawayOrderButton businessUnit="bar" />
                </div>
            </div>
            <TableGrid initialTables={barTables} businessUnit="bar" />
        </div>
    );
}

