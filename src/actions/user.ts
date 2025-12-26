"use server"

import { supabaseServer } from "@/lib/supabase/server"

export async function getUserById(userId: string) {
  try {
    console.log("Server action: Attempting to fetch user data for ID:", userId);
    
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error("Server action: Database query error:", error);
      return { success: false, error: error.message }
    }

    console.log("Server action: User data fetched successfully:", data);
    return { success: true, data }
  } catch (error: any) {
    console.error("Server action: Error fetching user:", error);
    return { success: false, error: error.message }
  }
}

