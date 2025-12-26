import { getSupabase } from "./client";

// Client-side database operations using the browser-safe Supabase client

export async function createDocument(collectionName: string, data: any) {
  try {
    const supabase = getSupabase();
    const { data: result, error } = await supabase
      .from(collectionName)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error(`Supabase error creating document in ${collectionName}:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      const errorMessage =
        error.message || error.details || error.hint || JSON.stringify(error);
      return { success: false, error: errorMessage };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorDetails: error
    });
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function getDocument(collectionName: string, id: string) {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(collectionName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}: `, error);
    return null;
  }
}

export async function updateDocument(
  collectionName: string,
  id: string,
  data: any,
) {
  try {
    const supabase = getSupabase();
    const query = supabase.from(collectionName) as any;
    const { data: result, error } = await query
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error(`Error updating document in ${collectionName}: `, error);
      const errorMessage =
        error.message || error.details || error.hint || JSON.stringify(error);
      return { success: false, error: errorMessage };
    }

    return { success: true, data: result };
  } catch (error) {
    console.error(`Error updating document in ${collectionName}: `, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function deleteDocument(collectionName: string, id: string) {
  try {
    console.log(`Attempting to delete document from ${collectionName} with ID: ${id}`);
    const supabase = getSupabase();
    const { error } = await supabase
      .from(collectionName)
      .delete()
      .eq("id", id);

    if (error) {
      console.error(`Error deleting document from ${collectionName}: `, error);
      const errorMessage =
        error.message || error.details || error.hint || JSON.stringify(error);
      return { success: false, error: errorMessage };
    }

    console.log(`Successfully deleted document from ${collectionName} with ID: ${id}`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}: `, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function getDocuments(collectionName: string, filters: { field: string; operator: string; value: any }[] = [], limit?: number) {
  try {
    const supabase = getSupabase();
    let query = supabase.from(collectionName).select("*");

    // Apply filters
    filters.forEach((filter) => {
      switch (filter.operator) {
        case "==":
          query = query.eq(filter.field, filter.value);
          break;
        case "!=":
          query = query.neq(filter.field, filter.value);
          break;
        case ">":
          query = query.gt(filter.field, filter.value);
          break;
        case "<":
          query = query.lt(filter.field, filter.value);
          break;
        case ">=":
          query = query.gte(filter.field, filter.value);
          break;
        case "<=":
          query = query.lte(filter.field, filter.value);
          break;
        case "in":
          query = query.in(filter.field, filter.value);
          break;
        default:
          query = query.eq(filter.field, filter.value);
      }
    });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Supabase error getting documents from ${collectionName}:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorDetails: error
    });
    return [];
  }
}

export async function queryDocuments(
  collectionName: string,
  filters: { field: string; operator: string; value: any }[] = [],
  orderByField?: string,
  orderByDirection: "asc" | "desc" = "asc",
  limit?: number,
) {
  try {
    const supabase = getSupabase();
    let query = supabase.from(collectionName).select("*");

    // Apply filters
    filters.forEach((filter) => {
      switch (filter.operator) {
        case "==":
          query = query.eq(filter.field, filter.value);
          break;
        case "!=":
          query = query.neq(filter.field, filter.value);
          break;
        case ">":
          query = query.gt(filter.field, filter.value);
          break;
        case "<":
          query = query.lt(filter.field, filter.value);
          break;
        case ">=":
          query = query.gte(filter.field, filter.value);
          break;
        case "<=":
          query = query.lte(filter.field, filter.value);
          break;
        case "in":
          query = query.in(filter.field, filter.value);
          break;
        default:
          query = query.eq(filter.field, filter.value);
      }
    });

    // Apply ordering
    if (orderByField) {
      query = query.order(orderByField, {
        ascending: orderByDirection === "asc",
      });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`Supabase error querying documents from ${collectionName}:`, error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}: `, error);
    return [];
  }
}

