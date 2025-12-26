import { requireAuth } from "@/lib/auth-helpers";
import { getTables } from "@/actions/tables";
import TableGrid from "@/components/tables/TableGrid";
import { TakeawayOrderButton } from "@/components/orders/TakeawayOrderButton";
import { UtensilsCrossed } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
    const session = await requireAuth();
    const userRole = session.user.role;
    const userBusinessUnit = session.user.businessUnit;

    // Determine if user can see all tables
    const canSeeAllTables =
        userRole === 'super_admin' ||
        userRole === 'owner' ||
        userBusinessUnit === 'all';

    let cafeTables: any[] = [];
    let barTables: any[] = [];
    let allTables: any[] = [];

    if (canSeeAllTables) {
        // Fetch tables from both business units
        cafeTables = await getTables('cafe');
        barTables = await getTables('bar');
        allTables = [...cafeTables, ...barTables];
    } else {
        // Fetch only user's business unit tables
        allTables = await getTables(userBusinessUnit);
    }

    return (
        <div className="flex h-[calc(100vh-6rem)] bg-[#F8FAFC] relative overflow-hidden rounded-xl border border-[#E5E7EB]/50 shadow-sm">
            {/* Abstract Glass Background */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#6D5DFB]/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#EDEBFF]/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="flex-1 flex flex-col p-6 overflow-hidden relative z-10 w-full">
                <div className="flex items-center justify-between space-y-2 mb-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-[#6D5DFB] flex items-center justify-center shadow-lg shadow-[#6D5DFB]/20">
                                <UtensilsCrossed className="h-5 w-5 text-white" />
                            </div>
                            <h1 className="text-2xl font-bold text-[#111827] tracking-tight">
                                {canSeeAllTables ? 'All Tables' : `${userBusinessUnit === 'cafe' ? 'Cafe & Restaurant' : 'Bar'} Tables`}
                            </h1>
                        </div>
                        <p className="text-[#9CA3AF] font-medium ml-14">
                            {canSeeAllTables
                                ? `Managing ${allTables.length} tables across all business units`
                                : 'Manage tables and live orders'
                            }
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <TakeawayOrderButton businessUnit={userBusinessUnit === 'bar' ? 'bar' : 'cafe'} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    {canSeeAllTables ? (
                        // Admin view: Show tables grouped by business unit
                        <div className="space-y-8">
                            {cafeTables.length > 0 && (
                                <div>
                                    <div className="mb-4">
                                        <h2 className="text-lg font-semibold text-[#111827]">Cafe & Restaurant Tables</h2>
                                        <p className="text-sm text-[#9CA3AF]">{cafeTables.length} tables</p>
                                    </div>
                                    <TableGrid initialTables={cafeTables} businessUnit="cafe" />
                                </div>
                            )}

                            {barTables.length > 0 && (
                                <div>
                                    <div className="mb-4">
                                        <h2 className="text-lg font-semibold text-[#111827]">Bar Tables</h2>
                                        <p className="text-sm text-[#9CA3AF]">{barTables.length} tables</p>
                                    </div>
                                    <TableGrid initialTables={barTables} businessUnit="bar" />
                                </div>
                            )}
                        </div>
                    ) : (
                        // Regular staff view: Show only their business unit tables
                        <TableGrid initialTables={allTables} businessUnit={userBusinessUnit} />
                    )}
                </div>
            </div>
        </div>
    );
}

