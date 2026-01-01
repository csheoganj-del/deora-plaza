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
        <div className="flex h-[calc(100vh-64px)] bg-[#FFFFFF] relative overflow-hidden">
            <div className="flex-1 flex flex-col p-8 overflow-hidden relative z-10 w-full">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-lg bg-[#F1F3F4] flex items-center justify-center border border-[#E0E0E0]">
                                <UtensilsCrossed className="h-6 w-6 text-[#5F6368]" />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-[28px] font-normal text-[#1B1B1F] tracking-normal mb-1 font-['Google_Sans'] select-text">
                                    {canSeeAllTables ? 'All Tables' : `${userBusinessUnit === 'cafe' ? 'Cafe & Restaurant' : 'Bar'} Tables`}
                                </h1>
                                <p className="text-[14px] text-[#5F6368] font-normal">
                                    {canSeeAllTables
                                        ? `Managing ${allTables.length} tables across all business units`
                                        : 'Manage tables and live orders'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <TakeawayOrderButton businessUnit={userBusinessUnit === 'bar' ? 'bar' : 'cafe'} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    {canSeeAllTables ? (
                        <div className="space-y-12">
                            {cafeTables.length > 0 && (
                                <div>
                                    <div className="mb-6 border-b border-[#E0E0E0] pb-2">
                                        <h2 className="text-[16px] font-medium text-[#202124]">Cafe & Restaurant</h2>
                                        <p className="text-[12px] text-[#5F6368]">{cafeTables.length} tables</p>
                                    </div>
                                    <TableGrid initialTables={cafeTables} businessUnit="cafe" />
                                </div>
                            )}

                            {barTables.length > 0 && (
                                <div>
                                    <div className="mb-6 border-b border-[#E0E0E0] pb-2">
                                        <h2 className="text-[16px] font-medium text-[#202124]">Bar</h2>
                                        <p className="text-[12px] text-[#5F6368]">{barTables.length} tables</p>
                                    </div>
                                    <TableGrid initialTables={barTables} businessUnit="bar" />
                                </div>
                            )}
                        </div>
                    ) : (
                        <TableGrid initialTables={allTables} businessUnit={userBusinessUnit} />
                    )}
                </div>
            </div>
        </div>
    );
}

