export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentCustomUser } from "@/actions/custom-auth";
import { getTables } from "@/actions/tables";
import TablesInterface from "@/components/tables/TablesInterface";

export default async function TablesPage() {
  const user = await getCurrentCustomUser();

  if (!user) {
    redirect("/login");
  }

  const userRole = String(user.role || "");
  const userBusinessUnit = String(user.businessUnit || "cafe");

  const canSeeAllTables =
    userRole === "super_admin" ||
    userRole === "owner" ||
    userBusinessUnit === "all";

  let allTables: any[] = [];

  try {
    if (canSeeAllTables) {
      const [cafeTables, barTables] = await Promise.all([
        getTables("cafe"),
        getTables("bar"),
      ]);
      allTables = [...cafeTables, ...barTables];
    } else {
      allTables = await getTables(userBusinessUnit);
    }
  } catch (err) {
    console.error("[tables page] failed to load tables:", err);
    allTables = [];
  }

  return (
    <TablesInterface
      initialTables={allTables}
      userBusinessUnit={userBusinessUnit}
      canSeeAllTables={canSeeAllTables}
    />
  );
}
