
import { requireAuth } from "@/lib/auth-helpers";
import { getTables } from "@/actions/tables";
import TablesInterface from "@/components/tables/TablesInterface";

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
        <TablesInterface
            initialTables={allTables}
            userBusinessUnit={userBusinessUnit}
            canSeeAllTables={canSeeAllTables}
        />
    );
}
