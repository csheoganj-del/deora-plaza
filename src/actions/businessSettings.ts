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
    
    // Waiterless mode toggles
    waiterlessMode?: boolean;
    barWaiterlessMode?: boolean;
    cafeWaiterlessMode?: boolean;
    hotelWaiterlessMode?: boolean;
    gardenWaiterlessMode?: boolean;
    
    // Security toggles
    enablePasswordProtection?: boolean;
    enableTwoFactorAuth?: boolean;
    
    // Module toggles
    enableBarModule?: boolean;
    enableHotelModule?: boolean;
    enableGardenModule?: boolean;
    enableInventoryModule?: boolean;
    enableAnalyticsModule?: boolean;
    enableKitchenModule?: boolean;
    enableBillingModule?: boolean;
    enableCustomerModule?: boolean;
    enableMenuModule?: boolean;
    enableUserManagementModule?: boolean;
    enableOrderManagementModule?: boolean;
    enableTablesModule?: boolean;
    enableStatisticsModule?: boolean;
    enableLocationsModule?: boolean;
    enableGSTReportModule?: boolean;
    enableSettlementsModule?: boolean;
    enableDiscountsModule?: boolean;
    enableRealtimeModule?: boolean;
    enableAutomationModule?: boolean;
    enableStaffPerformanceModule?: boolean;
    enableDailyReportsModule?: boolean;
    enableKitchenDisplayModule?: boolean;
    enableWaiterInterfaceModule?: boolean;
    
    // Payment toggles
    enableCashPayments?: boolean;
    enableCardPayments?: boolean;
    enableUPIPayments?: boolean;
    enableOnlinePayments?: boolean;
    enableCreditPayments?: boolean;
    
    // Order flow toggles
    enableOrderModification?: boolean;
    enableOrderCancellation?: boolean;
    enableSplitBilling?: boolean;
    enableCustomDiscounts?: boolean;
    enableLoyaltyProgram?: boolean;
    
    // Notification toggles
    enableKitchenNotifications?: boolean;
    enableWaiterNotifications?: boolean;
    enableCustomerNotifications?: boolean;
    enableSMSNotifications?: boolean;
    enableEmailNotifications?: boolean;
    
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
    
    // Advanced settings
    autoBackupEnabled?: boolean;
    dataRetentionDays?: number;
    maxOrdersPerTable?: number;
    orderTimeoutMinutes?: number;
    
    // Timestamps
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

        const updatedSettings = {
            ...settings,
            updatedAt: new Date().toISOString()
        };

        // Check for toggle changes to send notifications
        if (existingSettings) {
            await checkAndNotifyToggleChanges(existingSettings, updatedSettings);
            await updateDocument(BUSINESS_SETTINGS_COLLECTION, BUSINESS_SETTINGS_DOC_ID, updatedSettings)
        } else {
            // For Supabase, we need to include the ID in the data when creating
            const settingsWithId = {
                id: BUSINESS_SETTINGS_DOC_ID,
                ...updatedSettings,
                createdAt: new Date().toISOString()
            }
            await createDocument(BUSINESS_SETTINGS_COLLECTION, settingsWithId)
        }

        revalidatePath("/dashboard") // Revalidate paths that might display this info
        revalidatePath("/dashboard/billing")
        revalidatePath("/dashboard/orders")
        revalidatePath("/dashboard/settings")

        return { success: true }
    } catch (error) {
        console.error("Error updating business settings:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

/**
 * Check if a specific feature is enabled
 */
export async function isFeatureEnabled(feature: keyof BusinessSettings): Promise<boolean> {
    try {
        const settings = await getBusinessSettings();
        if (!settings) return false;
        
        return Boolean(settings[feature]);
    } catch (error) {
        console.error(`Error checking feature ${feature}:`, error);
        return false;
    }
}

/**
 * Check if a payment method is enabled
 */
export async function isPaymentMethodEnabled(method: 'cash' | 'card' | 'upi' | 'online' | 'credit'): Promise<boolean> {
    try {
        const settings = await getBusinessSettings();
        if (!settings) return true; // Default to enabled if no settings
        
        const featureMap = {
            cash: 'enableCashPayments',
            card: 'enableCardPayments',
            upi: 'enableUPIPayments',
            online: 'enableOnlinePayments',
            credit: 'enableCreditPayments'
        };
        
        const feature = featureMap[method] as keyof BusinessSettings;
        return settings[feature] !== false; // Default to enabled
    } catch (error) {
        console.error(`Error checking payment method ${method}:`, error);
        return true; // Default to enabled on error
    }
}

/**
 * Check if waiterless mode is enabled for a specific business unit
 */
export async function isWaiterlessModeEnabled(businessUnit: string): Promise<boolean> {
    try {
        const settings = await getBusinessSettings();
        if (!settings) return false;
        
        // Check unit-specific setting first, then fall back to global
        const unitSpecific = settings[`${businessUnit}WaiterlessMode` as keyof BusinessSettings];
        if (unitSpecific !== undefined) {
            return Boolean(unitSpecific);
        }
        
        return Boolean(settings.waiterlessMode);
    } catch (error) {
        console.error(`Error checking waiterless mode for ${businessUnit}:`, error);
        return false;
    }
}

/**
 * Get GST settings for a specific business unit
 */
export async function getGSTSettings(businessUnit: string): Promise<{
    enabled: boolean;
    percentage: number;
    gstNumber?: string;
}> {
    try {
        const settings = await getBusinessSettings();
        if (!settings) {
            return { enabled: true, percentage: 18 }; // Default GST
        }
        
        // Check unit-specific GST settings
        const unitEnabled = settings[`${businessUnit}GstEnabled` as keyof BusinessSettings];
        const unitPercentage = settings[`${businessUnit}GstPercentage` as keyof BusinessSettings];
        
        return {
            enabled: unitEnabled !== undefined ? Boolean(unitEnabled) : Boolean(settings.gstEnabled ?? true),
            percentage: (unitPercentage as number) || settings.gstPercentage || 18,
            gstNumber: settings.gstNumber
        };
    } catch (error) {
        console.error(`Error getting GST settings for ${businessUnit}:`, error);
        return { enabled: true, percentage: 18 };
    }
}

/**
 * Check for toggle changes and send notifications
 */
async function checkAndNotifyToggleChanges(oldSettings: any, newSettings: BusinessSettings) {
    try {
        const { getIntegratedNotificationSystem } = await import("@/lib/integrated-notification-system");
        const notificationSystem = getIntegratedNotificationSystem();

        // Check waiterless mode toggles
        const waiterlessToggles = [
            { key: 'waiterlessMode', unit: 'global' },
            { key: 'barWaiterlessMode', unit: 'bar' },
            { key: 'cafeWaiterlessMode', unit: 'cafe' },
            { key: 'hotelWaiterlessMode', unit: 'hotel' },
            { key: 'gardenWaiterlessMode', unit: 'garden' }
        ];

        for (const toggle of waiterlessToggles) {
            const oldValue = Boolean(oldSettings[toggle.key]);
            const newValue = Boolean(newSettings[toggle.key as keyof BusinessSettings]);
            
            if (oldValue !== newValue) {
                await notificationSystem.handleToggleChange(
                    'waiterless',
                    toggle.unit,
                    newValue,
                    {
                        toggleKey: toggle.key,
                        previousValue: oldValue
                    }
                );
            }
        }

        // Check GST toggles
        const gstToggles = [
            { key: 'gstEnabled', unit: 'global' },
            { key: 'barGstEnabled', unit: 'bar' },
            { key: 'cafeGstEnabled', unit: 'cafe' },
            { key: 'hotelGstEnabled', unit: 'hotel' },
            { key: 'gardenGstEnabled', unit: 'garden' }
        ];

        for (const toggle of gstToggles) {
            const oldValue = Boolean(oldSettings[toggle.key]);
            const newValue = Boolean(newSettings[toggle.key as keyof BusinessSettings]);
            
            if (oldValue !== newValue) {
                await notificationSystem.handleToggleChange(
                    'gst',
                    toggle.unit,
                    newValue,
                    {
                        toggleKey: toggle.key,
                        previousValue: oldValue,
                        gstPercentage: newSettings[`${toggle.unit}GstPercentage` as keyof BusinessSettings] || newSettings.gstPercentage
                    }
                );
            }
        }

        // Check GST percentage changes
        const gstPercentageToggles = [
            { key: 'gstPercentage', unit: 'global' },
            { key: 'barGstPercentage', unit: 'bar' },
            { key: 'cafeGstPercentage', unit: 'cafe' },
            { key: 'hotelGstPercentage', unit: 'hotel' },
            { key: 'gardenGstPercentage', unit: 'garden' }
        ];

        for (const toggle of gstPercentageToggles) {
            const oldValue = Number(oldSettings[toggle.key]) || 0;
            const newValue = Number(newSettings[toggle.key as keyof BusinessSettings]) || 0;
            
            if (oldValue !== newValue && newValue > 0) {
                await notificationSystem.handleToggleChange(
                    'gst',
                    toggle.unit,
                    true, // GST is enabled if percentage is set
                    {
                        toggleKey: toggle.key,
                        previousPercentage: oldValue,
                        newPercentage: newValue,
                        percentageChange: true
                    }
                );
            }
        }

    } catch (error) {
        console.warn("Failed to send toggle change notifications:", error);
    }
}

/**
 * Get default business settings with all features enabled
 */
export async function getDefaultBusinessSettings(): Promise<BusinessSettings> {
    return {
        name: "DEORA Plaza",
        address: "",
        mobile: "",
        gstEnabled: true,
        gstPercentage: 18,
        
        // Waiterless mode - disabled by default
        waiterlessMode: false,
        barWaiterlessMode: false,
        cafeWaiterlessMode: false,
        hotelWaiterlessMode: false,
        gardenWaiterlessMode: false,
        
        // Security - enabled by default
        enablePasswordProtection: true,
        enableTwoFactorAuth: false,
        
        // Modules - all enabled by default
        enableBarModule: true,
        enableHotelModule: true,
        enableGardenModule: true,
        enableInventoryModule: true,
        enableAnalyticsModule: true,
        enableKitchenModule: true,
        enableBillingModule: true,
        enableCustomerModule: true,
        enableMenuModule: true,
        enableUserManagementModule: true,
        enableOrderManagementModule: true,
        enableTablesModule: true,
        enableStatisticsModule: true,
        enableLocationsModule: true,
        enableGSTReportModule: true,
        enableSettlementsModule: true,
        enableDiscountsModule: true,
        enableRealtimeModule: true,
        enableAutomationModule: true,
        enableStaffPerformanceModule: true,
        enableDailyReportsModule: true,
        enableKitchenDisplayModule: true,
        enableWaiterInterfaceModule: true,
        
        // Payments - all enabled by default
        enableCashPayments: true,
        enableCardPayments: true,
        enableUPIPayments: true,
        enableOnlinePayments: true,
        enableCreditPayments: true,
        
        // Order flow - all enabled by default
        enableOrderModification: true,
        enableOrderCancellation: true,
        enableSplitBilling: false, // Disabled until implemented
        enableCustomDiscounts: true,
        enableLoyaltyProgram: true,
        
        // Notifications - all enabled by default
        enableKitchenNotifications: true,
        enableWaiterNotifications: true,
        enableCustomerNotifications: true,
        enableSMSNotifications: false, // Disabled until SMS service integrated
        enableEmailNotifications: false, // Disabled until email service integrated
        
        // Per-unit GST - all enabled with 18% default
        barGstEnabled: true,
        barGstPercentage: 18,
        cafeGstEnabled: true,
        cafeGstPercentage: 5, // Food items typically 5%
        hotelGstEnabled: true,
        hotelGstPercentage: 12, // Hotel services typically 12%
        gardenGstEnabled: true,
        gardenGstPercentage: 18,
        
        // Advanced settings
        autoBackupEnabled: true,
        dataRetentionDays: 365,
        maxOrdersPerTable: 10,
        orderTimeoutMinutes: 30,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
}

