import { getTables } from "@/actions/tables";
import TableGrid from "@/components/tables/TableGrid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coffee, Utensils } from "lucide-react";
import { TakeawayOrderButton } from "@/components/orders/TakeawayOrderButton";
export const dynamic = "force-dynamic"

export default async function TablesPage() {
    const allTables = await getTables();

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dining Tables</h2>
                <div className="flex items-center space-x-2">
                    <TakeawayOrderButton businessUnit="cafe" />
                </div>
            </div>
            <TableGrid initialTables={allTables} businessUnit="cafe" />
        </div>
    );
}
