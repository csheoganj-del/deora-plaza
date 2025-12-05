import { getMenuItems } from "./src/actions/menu";

async function checkDuplicates() {
    const items = await getMenuItems();
    console.log(`Total items: ${items.length}`);

    const nameCount: Record<string, number> = {};
    items.forEach((item: any) => {
        nameCount[item.name] = (nameCount[item.name] || 0) + 1;
    });

    console.log("\nDuplicate items:");
    Object.entries(nameCount).forEach(([name, count]) => {
        if (count > 1) {
            console.log(`- ${name}: ${count} times`);
        }
    });

    console.log("\nAll items:");
    items.forEach((item: any) => {
        console.log(`- ${item.name} (ID: ${item.id}, Category: ${item.category})`);
    });
}

checkDuplicates();
