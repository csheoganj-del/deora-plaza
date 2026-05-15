// Performance-optimized query utilities
import { getCachedData, setCachedData } from "./cache"

// Optimized query with caching and batch processing
export async function optimizedQuery(
  collectionName: string,
  filters: { field: string; operator: string; value: any }[] = [],
  orderByField?: string,
  orderByDirection: "asc" | "desc" = "asc",
  limit?: number,
  cacheTtl: number = 30000
) {
  const { queryDocuments } = await import("@/lib/supabase/database")
  
  // Create cache key
  const cacheKey = `${collectionName}_${JSON.stringify(filters)}_${orderByField}_${orderByDirection}_${limit || 'all'}`
  
  // Check cache first
  const cached = getCachedData(cacheKey)
  if (cached) {
    return cached
  }
  
  // Fetch data
  const data = await queryDocuments(collectionName, filters, orderByField, orderByDirection, limit)
  
  // Cache the result
  setCachedData(cacheKey, data, cacheTtl)
  
  return data
}

// Batch query for multiple collections
export async function batchQuery(queries: Array<{
  collectionName: string
  filters?: { field: string; operator: string; value: any }[]
  orderByField?: string
  orderByDirection?: "asc" | "desc"
  limit?: number
}>) {
  const { queryDocuments } = await import("@/lib/supabase/database")
  
  // Execute all queries in parallel
  const results = await Promise.all(
    queries.map(async (query) => {
      return await queryDocuments(
        query.collectionName,
        query.filters || [],
        query.orderByField,
        query.orderByDirection || 'asc',
        query.limit
      )
    })
  )
  
  return results
}

