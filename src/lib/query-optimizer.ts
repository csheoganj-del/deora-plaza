// Database Query Optimization System for DEORA
// Provides query analysis, optimization, and performance monitoring

import { logger, LogCategory } from './logging-system';
import { getCache } from './redis-cache';

export interface QueryPlan {
  query: string;
  parameters?: any[];
  executionTime?: number;
  rowCount?: number;
  indexUsage?: string[];
  recommendations?: string[];
  cost?: number;
}

export interface QueryMetrics {
  query: string;
  executionCount: number;
  totalExecutionTime: number;
  averageExecutionTime: number;
  maxExecutionTime: number;
  minExecutionTime: number;
  lastExecuted: Date;
  errorCount: number;
}

export interface OptimizationRule {
  name: string;
  description: string;
  check: (query: string, plan?: QueryPlan) => boolean;
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class QueryOptimizer {
  private static instance: QueryOptimizer;
  private queryMetrics: Map<string, QueryMetrics> = new Map();
  private optimizationRules: OptimizationRule[] = [];
  private cache = getCache();

  private constructor() {
    this.initializeOptimizationRules();
  }

  public static getInstance(): QueryOptimizer {
    if (!QueryOptimizer.instance) {
      QueryOptimizer.instance = new QueryOptimizer();
    }
    return QueryOptimizer.instance;
  }

  // Initialize optimization rules
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        name: 'SELECT_STAR',
        description: 'Avoid SELECT * in production queries',
        check: (query) => /\bSELECT\s+\*\s+FROM\b/i.test(query),
        recommendation: 'Specify only the columns you need instead of using SELECT *',
        severity: 'medium'
      },
      {
        name: 'MISSING_WHERE_CLAUSE',
        description: 'Queries without WHERE clauses may return too much data',
        check: (query) => /\bSELECT\b.*\bFROM\b/i.test(query) && !/\bWHERE\b/i.test(query),
        recommendation: 'Add a WHERE clause to limit the result set',
        severity: 'high'
      },
      {
        name: 'NO_LIMIT_CLAUSE',
        description: 'Queries without LIMIT may return excessive data',
        check: (query) => /\bSELECT\b/i.test(query) && !/\bLIMIT\b/i.test(query) && !/\bTOP\b/i.test(query),
        recommendation: 'Add a LIMIT clause to prevent returning too many rows',
        severity: 'medium'
      },
      {
        name: 'LIKE_WILDCARD_PREFIX',
        description: 'Leading wildcards in LIKE queries prevent index usage',
        check: (query) => /\bLIKE\s+['"]%[^'"]*['"]\b/i.test(query),
        recommendation: 'Avoid leading wildcards in LIKE queries or use full-text search',
        severity: 'high'
      },
      {
        name: 'OR_CONDITIONS',
        description: 'OR conditions can be inefficient, consider UNION or IN',
        check: (query) => (query.match(/\bOR\b/gi) || []).length > 2,
        recommendation: 'Consider using UNION ALL or IN clauses instead of multiple OR conditions',
        severity: 'medium'
      },
      {
        name: 'SUBQUERY_IN_SELECT',
        description: 'Subqueries in SELECT clause can be inefficient',
        check: (query) => /\bSELECT\b.*\(.*SELECT.*\)/i.test(query),
        recommendation: 'Consider using JOINs instead of subqueries in SELECT clause',
        severity: 'medium'
      },
      {
        name: 'ORDER_BY_WITHOUT_INDEX',
        description: 'ORDER BY without proper index can be slow',
        check: (query) => /\bORDER\s+BY\b/i.test(query),
        recommendation: 'Ensure indexed columns are used in ORDER BY clause',
        severity: 'medium'
      },
      {
        name: 'FUNCTION_IN_WHERE',
        description: 'Functions in WHERE clause prevent index usage',
        check: (query) => /\bWHERE\b.*\w+\s*\(/i.test(query),
        recommendation: 'Avoid using functions on indexed columns in WHERE clause',
        severity: 'high'
      }
    ];
  }

  // Analyze and optimize a query
  async analyzeQuery(query: string, parameters?: any[]): Promise<QueryPlan> {
    const startTime = Date.now();
    
    try {
      const plan: QueryPlan = {
        query,
        parameters,
        recommendations: []
      };

      // Check optimization rules
      this.optimizationRules.forEach(rule => {
        if (rule.check(query, plan)) {
          plan.recommendations!.push(rule.recommendation);
        }
      });

      // Get query execution plan (would need database-specific implementation)
      const executionPlan = await this.getExecutionPlan(query, parameters);
      if (executionPlan) {
        plan.indexUsage = executionPlan.indexUsage;
        plan.cost = executionPlan.cost;
      }

      const executionTime = Date.now() - startTime;
      plan.executionTime = executionTime;

      // Update metrics
      this.updateQueryMetrics(query, executionTime, false);

      logger.debug('Query analysis completed', {
        category: 'performance',
        query: query.substring(0, 100),
        executionTime,
        recommendations: plan.recommendations?.length
      });

      return plan;
    } catch (error) {
      this.updateQueryMetrics(query, Date.now() - startTime, true);
      
      logger.error('Query analysis failed', error as Error, LogCategory.DATABASE, {
        query: query.substring(0, 100)
      });

      throw error;
    }
  }

  // Get query execution plan (database-specific)
  private async getExecutionPlan(query: string, parameters?: any[]): Promise<{
    indexUsage?: string[];
    cost?: number;
  } | null> {
    try {
      // This would need to be implemented based on your database
      // For PostgreSQL: EXPLAIN ANALYZE
      // For MySQL: EXPLAIN
      // For now, return mock data
      
      const cacheKey = `query_plan:${Buffer.from(query).toString('base64').substring(0, 50)}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        return cached;
      }

      // Mock execution plan - in real implementation, this would query the database
      const plan = {
        indexUsage: this.extractIndexesFromQuery(query),
        cost: this.estimateQueryCost(query)
      };

      // Cache for 1 hour
      await this.cache.set(cacheKey, plan, 3600);

      return plan;
    } catch (error) {
      logger.warn('Failed to get execution plan', LogCategory.DATABASE, {
        error: (error as Error).message
      });
      return null;
    }
  }

  // Extract potential indexes from query
  private extractIndexesFromQuery(query: string): string[] {
    const indexes: string[] = [];
    
    // Extract columns from WHERE clause
    const whereMatch = query.match(/\bWHERE\b(.+?)(?:\bORDER\s+BY\b|\bGROUP\s+BY\b|\bHAVING\b|\bLIMIT\b|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const columnMatches = whereClause.match(/\b(\w+)\s*(?:=|>|<|>=|<=|LIKE|IN)/gi);
      if (columnMatches) {
        columnMatches.forEach(match => {
          const column = match.split(/\s+/)[0];
          if (!indexes.includes(column)) {
            indexes.push(column);
          }
        });
      }
    }

    // Extract columns from ORDER BY clause
    const orderMatch = query.match(/\bORDER\s+BY\b(.+?)(?:\bLIMIT\b|$)/i);
    if (orderMatch) {
      const orderClause = orderMatch[1];
      const columns = orderClause.split(',').map(col => col.trim().split(/\s+/)[0]);
      columns.forEach(column => {
        if (!indexes.includes(column)) {
          indexes.push(column);
        }
      });
    }

    return indexes;
  }

  // Estimate query cost (simplified)
  private estimateQueryCost(query: string): number {
    let cost = 100; // Base cost
    
    // Add cost for table joins
    const joinCount = (query.match(/\bJOIN\b/gi) || []).length;
    cost += joinCount * 50;
    
    // Add cost for subqueries
    const subqueryCount = (query.match(/\bSELECT\b.*\bFROM\b.*\bSELECT\b/gi) || []).length;
    cost += subqueryCount * 30;
    
    // Add cost for complex conditions
    const orCount = (query.match(/\bOR\b/gi) || []).length;
    cost += orCount * 20;
    
    // Add cost for functions
    const functionCount = (query.match(/\w+\s*\(/g) || []).length;
    cost += functionCount * 10;
    
    return cost;
  }

  // Update query metrics
  private updateQueryMetrics(query: string, executionTime: number, hasError: boolean): void {
    const queryHash = this.hashQuery(query);
    let metrics = this.queryMetrics.get(queryHash);

    if (!metrics) {
      metrics = {
        query,
        executionCount: 0,
        totalExecutionTime: 0,
        averageExecutionTime: 0,
        maxExecutionTime: 0,
        minExecutionTime: Infinity,
        lastExecuted: new Date(),
        errorCount: 0
      };
      this.queryMetrics.set(queryHash, metrics);
    }

    metrics.executionCount++;
    metrics.totalExecutionTime += executionTime;
    metrics.averageExecutionTime = metrics.totalExecutionTime / metrics.executionCount;
    metrics.maxExecutionTime = Math.max(metrics.maxExecutionTime, executionTime);
    metrics.minExecutionTime = Math.min(metrics.minExecutionTime, executionTime);
    metrics.lastExecuted = new Date();

    if (hasError) {
      metrics.errorCount++;
    }
  }

  // Hash query for metrics key
  private hashQuery(query: string): string {
    // Simple hash - in production, use a proper hashing function
    return Buffer.from(query.toLowerCase().replace(/\s+/g, ' ')).toString('base64').substring(0, 32);
  }

  // Get slow queries
  getSlowQueries(thresholdMs: number = 1000, limit: number = 10): QueryMetrics[] {
    const queries = Array.from(this.queryMetrics.values())
      .filter(metrics => metrics.averageExecutionTime > thresholdMs)
      .sort((a, b) => b.averageExecutionTime - a.averageExecutionTime)
      .slice(0, limit);

    return queries;
  }

  // Get frequently executed queries
  getFrequentQueries(limit: number = 10): QueryMetrics[] {
    return Array.from(this.queryMetrics.values())
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, limit);
  }

  // Get error-prone queries
  getErrorProneQueries(limit: number = 10): QueryMetrics[] {
    return Array.from(this.queryMetrics.values())
      .filter(metrics => metrics.errorCount > 0)
      .sort((a, b) => b.errorCount - a.executionCount)
      .slice(0, limit);
  }

  // Optimize query with suggestions
  optimizeQuery(query: string): {
    originalQuery: string;
    optimizedQuery: string;
    improvements: string[];
    estimatedPerformanceGain: number;
  } {
    let optimizedQuery = query;
    const improvements: string[] = [];
    let performanceGain = 0;

    // Apply optimizations
    if (/\bSELECT\s+\*\s+FROM\b/i.test(query)) {
      // Replace SELECT * with specific columns (mock implementation)
      optimizedQuery = optimizedQuery.replace(/\bSELECT\s+\*\s+FROM\b/i, 'SELECT id, name, created_at FROM');
      improvements.push('Replaced SELECT * with specific columns');
      performanceGain += 20;
    }

    if (!/\bLIMIT\b/i.test(query) && /\bSELECT\b/i.test(query)) {
      optimizedQuery += ' LIMIT 1000';
      improvements.push('Added LIMIT clause to prevent excessive data retrieval');
      performanceGain += 15;
    }

    if (/\bLIKE\s+['"]%[^'"]*['"]\b/i.test(query)) {
      improvements.push('Consider using full-text search instead of leading wildcard LIKE');
      performanceGain += 25;
    }

    return {
      originalQuery: query,
      optimizedQuery,
      improvements,
      estimatedPerformanceGain: performanceGain
    };
  }

  // Generate query performance report
  generatePerformanceReport(): {
    timestamp: Date;
    totalQueries: number;
    averageExecutionTime: number;
    slowQueries: QueryMetrics[];
    frequentQueries: QueryMetrics[];
    errorProneQueries: QueryMetrics[];
    recommendations: string[];
  } {
    const allMetrics = Array.from(this.queryMetrics.values());
    const totalQueries = allMetrics.reduce((sum, m) => sum + m.executionCount, 0);
    const averageExecutionTime = allMetrics.length > 0 
      ? allMetrics.reduce((sum, m) => sum + m.averageExecutionTime, 0) / allMetrics.length 
      : 0;

    const recommendations = this.generateRecommendations(allMetrics);

    return {
      timestamp: new Date(),
      totalQueries,
      averageExecutionTime,
      slowQueries: this.getSlowQueries(),
      frequentQueries: this.getFrequentQueries(),
      errorProneQueries: this.getErrorProneQueries(),
      recommendations
    };
  }

  // Generate performance recommendations
  private generateRecommendations(metrics: QueryMetrics[]): string[] {
    const recommendations: string[] = [];
    
    const slowQueries = metrics.filter(m => m.averageExecutionTime > 1000);
    if (slowQueries.length > 0) {
      recommendations.push(`Found ${slowQueries.length} slow queries (avg > 1s). Consider adding indexes or optimizing queries.`);
    }

    const errorQueries = metrics.filter(m => m.errorCount > 0);
    if (errorQueries.length > 0) {
      recommendations.push(`Found ${errorQueries.length} queries with errors. Review and fix problematic queries.`);
    }

    const frequentQueries = metrics.filter(m => m.executionCount > 100);
    if (frequentQueries.length > 0) {
      recommendations.push(`Found ${frequentQueries.length} frequently executed queries. Consider caching results.`);
    }

    return recommendations;
  }

  // Clear metrics
  clearMetrics(): void {
    this.queryMetrics.clear();
    logger.info('Query metrics cleared', LogCategory.SYSTEM);
  }

  // Get optimization rules
  getOptimizationRules(): OptimizationRule[] {
    return [...this.optimizationRules];
  }

  // Add custom optimization rule
  addOptimizationRule(rule: OptimizationRule): void {
    this.optimizationRules.push(rule);
    logger.info('Custom optimization rule added', LogCategory.SYSTEM, {
      ruleName: rule.name
    });
  }
}

// Export singleton instance
export const queryOptimizer = QueryOptimizer.getInstance();

// Utility functions
export const analyzeQuery = (query: string, parameters?: any[]) => 
  queryOptimizer.analyzeQuery(query, parameters);

export const optimizeQuery = (query: string) => 
  queryOptimizer.optimizeQuery(query);

export const getSlowQueries = (thresholdMs?: number, limit?: number) => 
  queryOptimizer.getSlowQueries(thresholdMs, limit);

export const getQueryPerformanceReport = () => 
  queryOptimizer.generatePerformanceReport();

// Higher-order function for query execution with monitoring
export function withQueryMonitoring<T>(
  queryFn: (query: string, ...args: any[]) => Promise<T>
) {
  return async (query: string, ...args: any[]): Promise<T> => {
    const startTime = Date.now();
    
    try {
      // Analyze query before execution
      await queryOptimizer.analyzeQuery(query, args[0]);
      
      // Execute query
      const result = await queryFn(query, ...args);
      
      const executionTime = Date.now() - startTime;
      
      logger.debug('Query executed successfully', {
        category: 'database',
        query: query.substring(0, 100),
        executionTime
      });
      
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error('Query execution failed', error as Error, LogCategory.DATABASE, {
        query: query.substring(0, 100),
        executionTime
      });
      
      throw error;
    }
  };
}

export default queryOptimizer;

