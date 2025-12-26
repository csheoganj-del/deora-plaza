"use server"

import { getDocument, updateDocument, createDocument } from "@/lib/supabase/database"
import { supabaseServer } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface BusinessSettings {
    name: string;
    address: string;
    mobile: string;
    gstEnabled?: boolean;
    gstPercentage?: number;
    gstNumber?: string;
    waiterlessMode?: boolean;
    barWaiterlessMode?: boolean;
    cafeWaiterlessMode?: boolean;
    hotelWaiterlessMode?: boolean;
    gardenWaiterlessMode?: boolean;
    enablePasswordProtection?: boolean;
    enableBarModule?: boolean;
    // Garden-specific settings
    gardenName?: string;
    gardenAddress?: string;
    gardenMobile?: string;
    gardenGstNumber?: string;
    // Per-unit GST settings
    barGstEnabled?: boolean;
    barGstPercentage?: number;
    cafeGstEnabled?: boolean;
    cafeGstPercentage?: number;
    hotelGstEnabled?: boolean;
    hotelGstPercentage?: number;
    gardenGstEnabled?: boolean;
    gardenGstPercentage?: number;
    createdAt?: string;
    updatedAt?: string;
}

const BUSINESS_SETTINGS_COLLECTION = "businessSettings"
const BUSINESS_SETTINGS_DOC_ID = "default"

export async function getBusinessSettings(): Promise<BusinessSettings | null> {
    try {
        console.log("getBusinessSettings: Fetching settings...")
        const settingsDoc = await getDocument(BUSINESS_SETTINGS_COLLECTION, BUSINESS_SETTINGS_DOC_ID)

        if (!settingsDoc) {
            console.log("getBusinessSettings: No settings found")
            return null
        }

        const { id, ...settings } = settingsDoc
        console.log("getBusinessSettings: Raw settings retrieved:", JSON.stringify(settings, null, 2))

        // Sanitization to ensure serialization compatibility
        return JSON.parse(JSON.stringify(settings as BusinessSettings))
    } catch (error) {
        console.error("Error getting business settings:", error)
        return null
    }
}


export async function updateBusinessSettings(settings: BusinessSettings) {
    try {
        const existingSettings = await getDocument(BUSINESS_SETTINGS_COLLECTION, BUSINESS_SETTINGS_DOC_ID)

        if (existingSettings) {
            await updateDocument(BUSINESS_SETTINGS_COLLECTION, BUSINESS_SETTINGS_DOC_ID, settings)
        } else {
            // For Supabase, we need to include the ID in the data when creating
            const settingsWithId = {
                id: BUSINESS_SETTINGS_DOC_ID,
                ...settings
            }
            await createDocument(BUSINESS_SETTINGS_COLLECTION, settingsWithId)
        }

        revalidatePath("/dashboard") // Revalidate paths that might display this info
        revalidatePath("/dashboard/billing")
        // Add other relevant paths as needed

        return { success: true }
    } catch (error) {
        console.error("Error updating business settings:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

