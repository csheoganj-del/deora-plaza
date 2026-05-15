
import { getMenuItems } from "./src/actions/menu";

async function check() {
    console.log("Checking ALL menu items...");
    const allItems = await getMenuItems();
    console.log(`Found ${allItems.length} total items:`);
    allItems.forEach((item: any) => console.log(`- ${item.name} (${item.category}) [${item.businessUnit}]`));
}

check();
