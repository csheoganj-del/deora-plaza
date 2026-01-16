
import { getBusinessSettings } from "./src/actions/businessSettings";

async function checkSettings() {
    const settings = await getBusinessSettings();
    console.log("CURRENT BUSINESS SETTINGS:");
    console.log(JSON.stringify(settings, null, 2));
}

checkSettings();
