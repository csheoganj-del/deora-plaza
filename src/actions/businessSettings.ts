"use server"

import { getDocument, updateDocument, createDocument, serializeTimestamps } from "@/lib/firebase/firestore"
import { revalidatePath } from "next/cache"

interface BusinessSettings {
    name: string;
    address: string;
    mobile: string;
    createdAt?: string;
    updatedAt?: string;
}

const BUSINESS_SETTINGS_COLLECTION = "businessSettings"
const BUSINESS_SETTINGS_DOC_ID = "default"

export async function getBusinessSettings(): Promise<BusinessSettings | null> {
    try {
        const settingsDoc = await getDocument(BUSINESS_SETTINGS_COLLECTION, BUSINESS_SETTINGS_DOC_ID)
        
        if (!settingsDoc) {
            return null
        }

        const { id, ...settings } = settingsDoc
        return serializeTimestamps(settings) as BusinessSettings
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
            await createDocument(BUSINESS_SETTINGS_COLLECTION, settings, BUSINESS_SETTINGS_DOC_ID)
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
