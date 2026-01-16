import { supabaseServer } from "./server";
import { validateQueryFilters, isFieldAllowed } from "@/lib/database-validation";

// Generic CRUD operations for Supabase
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableError(err: any): boolean {
  const msg = (err?.message || err?.toString?.() || "").toLowerCase();
  const status = typeof err?.status === "number" ? err.status : undefined;
  if (status && (status === 408 || status === 429 || status >= 500)) return true;
  return (
    msg.includes("wsarecv") ||
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("timeout") ||
    msg.includes("timed out") ||
    msg.includes("econn") ||
    msg.includes("enotfound") ||
    msg.includes("socket hang up")
  );
}

async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { retries?: number; baseDelayMs?: number; maxDelayMs?: number } = {}
): Promise<T> {
  const retries = opts.retries ?? 2;
  const base = opts.baseDelayMs ?? 500;
  const max = opts.maxDelayMs ?? 4000;
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= retries || !isRetryableError(err)) throw err;
      const jitter = Math.random() * 0.25 + 0.85; // 0.85x - 1.1x
      const delay = Math.min(max, Math.round(base * Math.pow(2, attempt) * jitter));
      await wait(delay);
      attempt += 1;
    }
  }
}

export async function createDocument(collectionName: string, data: any) {
  try {
    const { data: result, error } = await supabaseServer
      .from(collectionName)
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error(`Error creating document in ${collectionName}: `, error);
      const errorMessage =
        error.message || error.details || error.hint || JSON.stringify(error);
      return { success: false, error: errorMessage };
    }

    console.log(`[DB] Document created in ${collectionName}:`, result);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Error creating document in ${collectionName}: `, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export async function getDocument(collectionName: string, id: string) {
  try {
    const exec = async () => {
      const { data, error } = await supabaseServer
        .from(collectionName)
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    };

    const data = await withRetry(exec, { retries: 2 });
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
    const { data: result, error } = await supabaseServer
      .from(collectionName)
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
    const { error } = await supabaseServer
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
    let query = supabaseServer.from(collectionName).select("*");

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

    const res = await withRetry(async () => {
      const r = await query;
      if ((r as any)?.error) throw (r as any).error;
      return r as any;
    }, { retries: 2 });

    return (res as any)?.data || [];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}: `, error);
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
    const startTime = Date.now();
    console.log(`[PERF] queryDocuments started:`, { collectionName, filters, orderByField, orderByDirection, limit });

    // SECURITY: Validate filters to prevent column enumeration
    const validation = validateQueryFilters(collectionName, filters);
    if (!validation.valid) {
      console.error(`Query validation failed: ${validation.error}`);
      return [];
    }

    // SECURITY: Validate orderBy field if provided
    if (orderByField && !isFieldAllowed(collectionName, orderByField)) {
      console.error(`OrderBy field '${orderByField}' is not allowed for collection '${collectionName}'`);
      return [];
    }

    let query = supabaseServer.from(collectionName).select("*");

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

    const res = await withRetry(async () => {
      const r = await query;
      if ((r as any)?.error) throw (r as any).error;
      return r as any;
    }, { retries: 2 });

    const duration = Date.now() - startTime;
    console.log(`[PERF] queryDocuments completed in ${duration}ms for ${collectionName}`);

    return (res as any)?.data || [];
  } catch (error: unknown) {
    console.error(`Error querying documents from ${collectionName}: `, error);
    if (error instanceof Error) {
      console.error(`Error stack:`, error.stack);
    }
    return [];
  }
}
