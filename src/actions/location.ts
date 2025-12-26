"use server";

import { queryDocuments, createDocument, updateDocument, deleteDocument } from "@/lib/supabase/database";
import { revalidatePath } from "next/cache";

export interface UserLocation {
    user_id: string;
    latitude: number;
    longitude: number;
    timestamp: string;
    metadata?: any;
}

export interface ActivityLog {
    id: string;
    user_id: string;
    activity_type: string;
    description: string;
    location_id?: string;
    latitude?: number;
    longitude?: number;
    timestamp: string;
    metadata?: any;
}

export async function saveUserLocation(userId: string, lat: number, lng: number, metadata: any = {}) {
    try {
        // Upsert location
        // Since our queryDocuments generic helper might not support upsert easily, we'll try to find and update or create
        // In a real generic SQL setup, we'd use ON CONFLICT.
        // For this codebase's "queryDocuments" abstraction (which seems to use Firestore-like or simple wrapper),
        // let's check if we can raw query. If not, we do read-modify-write.

        // Check existing
        const existing = await queryDocuments("user_locations", [
            { field: 'user_id', operator: '==', value: userId }
        ]);

        if (existing && existing.length > 0) {
            await updateDocument("user_locations", userId, {
                latitude: lat,
                longitude: lng,
                timestamp: new Date().toISOString(),
                metadata
            });
        } else {
            // user_locations primary key is user_id. 
            // If createDocument generates an ID, we might have issues if we want user_id to BE the key.
            // Assuming createDocument takes (table, data) and handles ID. 
            // If the underlying db is SQL, we need to ensure the ID matches.
            // We'll pass user_id as part of data.
            await createDocument("user_locations", {
                user_id: userId,
                latitude: lat,
                longitude: lng,
                timestamp: new Date().toISOString(),
                metadata
            });
        }

        revalidatePath("/dashboard/statistics");
        return { success: true };
    } catch (error) {
        console.error("Error saving location:", error);
        return { success: false, error };
    }
}

export async function logActivityWithLocation(
    userId: string,
    activityType: string,
    description: string,
    lat?: number,
    lng?: number,
    metadata: any = {}
) {
    try {
        await createDocument("activity_logs", {
            id: crypto.randomUUID(),
            user_id: userId,
            activity_type: activityType,
            description,
            latitude: lat,
            longitude: lng,
            timestamp: new Date().toISOString(),
            metadata
        });
        return { success: true };
    } catch (error) {
        console.error("Error logging activity:", error);
        return { success: false, error };
    }
}

export async function getAllUserLocations() {
    try {
        // Join with users to get names? 
        // The queryDocuments might not support joins. We'll fetch locations and users separately or rely on frontend to merge.
        // Fetching all locations
        const locations = await queryDocuments("user_locations", []);
        // Fetch users info to map names
        const users = await queryDocuments("users", []);

        return locations.map((loc: any) => {
            const user = users.find((u: any) => u.id === loc.user_id);
            return {
                ...loc,
                userName: user?.name || user?.username || "Unknown User",
                userRole: user?.role
            };
        });
    } catch (error) {
        console.error("Error getting locations:", error);
        return [];
    }
}
export async function logUserLogin(userId: string, location: { lat: number; lng: number }) {
    try {
        await logActivityWithLocation(
            userId,
            "login",
            `User logged in from login page`,
            location.lat,
            location.lng,
            { userAgent: "web" }
        );
        return { success: true };
    } catch (error) {
        console.error("Failed to log login activity:", error);
        return { success: false, error: String(error) };
    }
}

