"use server";

import { supabaseServer } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Category = {
    id: string;
    name: string;
    description?: string | null;
    slug: string;
    parent_id?: string | null;
    business_unit: string;
    sort_order: number;
    is_active: boolean;
    children?: Category[]; // For hierarchical view
};

export async function getCategories(businessUnit?: string) {
    try {
        let query = supabaseServer
            .from("categories")
            .select("*")
            .eq("is_active", true)
            .order("sort_order", { ascending: true });

        if (businessUnit && businessUnit !== "all") {
            // Fetch 'all' generic categories + specific unit categories
            query = query.in("business_unit", ["all", businessUnit]);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data as Category[];
    } catch (error) {
        console.error("Error fetching categories:", error);
        return [];
    }
}

export async function getCategoryTree(businessUnit?: string) {
    const categories = await getCategories(businessUnit);

    // Build tree
    const categoryMap = new Map<string, Category>();
    const roots: Category[] = [];

    // First pass: create map
    categories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: link children
    categories.forEach(cat => {
        const node = categoryMap.get(cat.id)!;
        if (cat.parent_id && categoryMap.has(cat.parent_id)) {
            categoryMap.get(cat.parent_id)!.children!.push(node);
        } else {
            roots.push(node);
        }
    });

    return roots;
}

export async function createCategory(data: Partial<Category>) {
    try {
        const slug = data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || '';

        const { data: newCategory, error } = await supabaseServer
            .from("categories")
            .insert({
                name: data.name,
                description: data.description,
                slug,
                parent_id: data.parent_id,
                business_unit: data.business_unit || "all",
                sort_order: data.sort_order || 0
            })
            .select()
            .single();

        if (error) throw error;

        revalidatePath("/dashboard/menu");
        return { success: true, data: newCategory };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateCategory(id: string, data: Partial<Category>) {
    try {
        const updateData: any = { ...data };
        if (data.name) {
            updateData.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }
        delete updateData.id;
        delete updateData.children;

        const { error } = await supabaseServer
            .from("categories")
            .update(updateData)
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/dashboard/menu");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteCategory(id: string) {
    try {
        const { error } = await supabaseServer
            .from("categories")
            .delete()
            .eq("id", id);

        if (error) throw error;

        revalidatePath("/dashboard/menu");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateCategoryOrder(items: { id: string; sort_order: number }[]) {
    try {
        // Run updates in parallel
        const promises = items.map(item =>
            supabaseServer
                .from("categories")
                .update({ sort_order: item.sort_order, updated_at: new Date().toISOString() })
                .eq("id", item.id)
        );

        await Promise.all(promises);

        revalidatePath("/dashboard/menu");
        return { success: true };
    } catch (error: any) {
        console.error("Error reordering categories:", error);
        return { success: false, error: error.message };
    }
}

