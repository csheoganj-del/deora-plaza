"use server";

import { queryDocuments, updateDocument } from "@/lib/supabase/database";
import { requireAuth } from "@/lib/auth-helpers";

export async function getRecentNotifications() {
    try {
        const session = await requireAuth();
        const role = session.user.role;
        const businessUnit = session.user.businessUnit;

        console.log(`[getRecentNotifications] Fetching for User: ${session.user.username}, Role: ${role}, Unit: ${businessUnit}`);

        const filters: any[] = [
            { field: "isRead", operator: "==", value: false }
        ];

        // Role-based filtering
        if (role === "super_admin" || role === "owner") {
            // Admins see all unread notifications
            console.log('[getRecentNotifications] Role is Admin/Owner - No extra filters');
        } else if (role === "waiter") {
            filters.push({ field: "recipient", operator: "in", value: ["waiter", "all"] });
        } else if (role === "kitchen") {
            filters.push({ field: "recipient", operator: "in", value: ["kitchen", "all"] });
        } else if (role === "bar_manager") {
            filters.push({ field: "businessUnit", operator: "==", value: "bar" });
        } else if (role === "cafe_manager") {
            // Cafe managers might want to see both restaurant notifications
            filters.push({ field: "businessUnit", operator: "in", value: ["restaurant", "cafe", "takeaway"] }); // Added takeaway support just in case
        }

        console.log('[getRecentNotifications] Applied Filters:', JSON.stringify(filters));

        const notifications = await queryDocuments("notifications", filters, "createdAt", "desc");

        console.log(`[getRecentNotifications] Found ${notifications?.length || 0} notifications`);

        return { success: true, data: notifications || [] };
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return { success: false, error: "Failed to fetch notifications" };
    }
}

export async function markNotificationAsRead(notificationId: string) {
    try {
        await updateDocument("notifications", notificationId, { isRead: true });
        return { success: true };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { success: false, error: "Failed to update notification" };
    }
}
