// Queue System for Offline Operations - Redundant Backend Architecture

import { QueueConfig, QueueItem, QueueError } from '../core/types';
import { GlobalLogger } from '../logger';
import fs from 'fs';
import path from 'path';

export interface QueueInterface {
  add(operation: string, data: any, priority?: number): Promise<string>;
  process(): Promise<void>;
  getStatus(): QueueStatus;
  clear(): Promise<void>;
  retry(itemId: string): Promise<boolean>;
  remove(itemId: string): Promise<boolean>;
  pause(): void;
  resume(): void;
  flush(): Promise<number>;
  size(): number;
}

export interface QueueStatus {
  size: number;
  processing: boolean;
  paused: boolean;
  totalProcessed: number;
  totalFailed: number;
  lastProcessed: Date | null;
  uptime: number;
}

export interface QueueProcessor {
  operation: string;
  handler: (data: any) => Promise<any>;
  retryable: boolean;
}

class MemoryQueue implements QueueInterface {
  private queue: QueueItem[] = [];
  private processing = false;
  private paused = false;
  private processors = new Map<string, QueueProcessor>();
  private stats = {
    totalProcessed: 0,
    totalFailed: 0,
    startTime: new Date()
  };
  private lastProcessed: Date | null = null;
  private logger: GlobalLogger;
  private config: QueueConfig;

  constructor(config: QueueConfig, logger: GlobalLogger) {
    this.config = config;
    this.logger = logger;
    this.setupDefaultProcessors();
  }

  private setupDefaultProcessors(): void {
    // Default processors for common operations
    this.registerProcessor('database_write', async (data) => {
      // This would integrate with your database system
      this.logger.debug('Processing database write', { metadata: data });
      return { success: true };
    }, true);

    this.registerProcessor('cache_invalidate', async (data) => {
      // This would integrate with your cache system
      this.logger.debug('Processing cache invalidation', { metadata: data });
      return { success: true };
    }, true);

    this.registerProcessor('api_request', async (data) => {
      // This would make external API requests
      this.logger.debug('Processing API request', { metadata: data });
      return { success: true };
    }, true);
  }

  registerProcessor(operation: string, handler: (data: any) => Promise<any>, retryable = true): void {
    this.processors.set(operation, {
      operation,
      handler,
      retryable
    });
    this.logger.info(`Registered queue processor: ${operation}`, {
      operation: 'queue_processor_register',
      metadata: { operation, retryable }
    });
  }

  private generateId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async add(operation: string, data: any, priority = 5): Promise<string> {
    if (this.queue.length >= this.config.maxSize) {
      throw new QueueError(`Queue is full (max: ${this.config.maxSize})`);
    }

    const item: QueueItem = {
      id: this.generateId(),
      operation,
      data,
      attempts: 0,
      maxAttempts: this.config.retryAttempts,
      createdAt: new Date(),
      nextRetry: new Date(),
      priority: Math.max(1, Math.min(10, priority)) // Clamp between 1-10
    };

    // Insert in priority order (higher priority first)
    let inserted = false;
    for (let i = 0; i < this.queue.length; i++) {
      if (this.queue[i].priority < item.priority) {
        this.queue.splice(i, 0, item);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      this.queue.push(item);
    }

    this.logger.logQueueEvent('queue_add', item.id, operation, 0, true);

    // Start processing if not already processing
    if (!this.processing && !this.paused) {
      setImmediate(() => this.process());
    }

    return item.id;
  }

  async process(): Promise<void> {
    if (this.processing || this.paused || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    this.logger.debug('Starting queue processing', {
      operation: 'queue_process_start',
      metadata: { queueSize: this.queue.length }
    });

    while (this.queue.length > 0 && !this.paused) {
      const item = this.queue.shift();
      if (!item) continue;

      // Check if it's time to retry this item
      if (item.nextRetry > new Date()) {
        // Put it back in the queue for later
        this.queue.push(item);
        continue;
      }

      try {
        await this.processItem(item);
      } catch (error) {
        this.logger.error(`Queue processing error for item ${item.id}`, error as Error, {
          operation: 'queue_process_error',
          metadata: { itemId: item.id, operation: item.operation }
        });
      }
    }

    this.processing = false;
    this.logger.debug('Queue processing completed', {
      operation: 'queue_process_end',
      metadata: { remainingItems: this.queue.length }
    });
  }

  private async processItem(item: QueueItem): Promise<void> {
    item.attempts++;
    this.logger.logQueueEvent('queue_process', item.id, item.operation, item.attempts, false);

    const processor = this.processors.get(item.operation);
    if (!processor) {
      this.logger.error(`No processor found for operation: ${item.operation}`, undefined, {
        operation: 'queue_process_error',
        metadata: { itemId: item.id, operation: item.operation }
      });
      this.stats.totalFailed++;
      return;
    }

    try {
      const result = await processor.handler(item.data);

      // Success
      this.stats.totalProcessed++;
      this.lastProcessed = new Date();
      this.logger.logQueueEvent('queue_process', item.id, item.operation, item.attempts, true);

      return;
    } catch (error) {
      this.logger.error(`Queue item processing failed: ${item.id}`, error as Error, {
        operation: 'queue_item_failed',
        metadata: {
          itemId: item.id,
          operation: item.operation,
          attempts: item.attempts,
          maxAttempts: item.maxAttempts
        }
      });

      // Check if we should retry
      if (processor.retryable && item.attempts < item.maxAttempts) {
        // Calculate next retry time with exponential backoff
        const delay = Math.min(
          this.config.retryDelay * Math.pow(2, item.attempts - 1),
          30000 // Max 30 seconds
        );
        item.nextRetry = new Date(Date.now() + delay);

        // Put back in queue for retry
        this.queue.push(item);
        this.logger.logQueueEvent('queue_retry', item.id, item.operation, item.attempts, false);
      } else {
        // Max attempts reached or not retryable
        this.stats.totalFailed++;
        this.logger.logQueueEvent('queue_fail', item.id, item.operation, item.attempts, false);
      }
    }
  }

  getStatus(): QueueStatus {
    return {
      size: this.queue.length,
      processing: this.processing,
      paused: this.paused,
      totalProcessed: this.stats.totalProcessed,
      totalFailed: this.stats.totalFailed,
      lastProcessed: this.lastProcessed,
      uptime: Date.now() - this.stats.startTime.getTime()
    };
  }

  async clear(): Promise<void> {
    const clearedCount = this.queue.length;
    this.queue = [];
    this.logger.info(`Queue cleared: ${clearedCount} items removed`, {
      operation: 'queue_clear',
      metadata: { clearedCount }
    });
  }

  async retry(itemId: string): Promise<boolean> {
    const itemIndex = this.queue.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return false;
    }

    const item = this.queue[itemIndex];
    item.nextRetry = new Date(); // Retry immediately
    this.logger.info(`Manual retry triggered for item: ${itemId}`, {
      operation: 'queue_manual_retry',
      metadata: { itemId, operation: item.operation }
    });

    // Trigger processing if not already processing
    if (!this.processing && !this.paused) {
      setImmediate(() => this.process());
    }

    return true;
  }

  async remove(itemId: string): Promise<boolean> {
    const itemIndex = this.queue.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      return false;
    }

    const item = this.queue.splice(itemIndex, 1)[0];
    this.logger.info(`Item removed from queue: ${itemId}`, {
      operation: 'queue_remove',
      metadata: { itemId, operation: item.operation }
    });

    return true;
  }

  pause(): void {
    this.paused = true;
    this.logger.info('Queue processing paused', { operation: 'queue_pause' });
  }

  resume(): void {
    this.paused = false;
    this.logger.info('Queue processing resumed', { operation: 'queue_resume' });

    // Start processing if there are items and not already processing
    if (!this.processing && this.queue.length > 0) {
      setImmediate(() => this.process());
    }
  }

  async flush(): Promise<number> {
    let processed = 0;
    const originalPausedState = this.paused;

    // Temporarily unpause to process all items
    this.paused = false;

    while (this.queue.length > 0) {
      await this.process();

      // Safety check to prevent infinite loop
      if (this.queue.length > 0) {
        // Wait a bit before next attempt
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      processed++;

      // Safety limit
      if (processed > 1000) {
        this.logger.warn('Queue flush stopped: too many iterations', {
          operation: 'queue_flush_limit',
          metadata: { processed, remaining: this.queue.length }
        });
        break;
      }
    }

    // Restore original paused state
    this.paused = originalPausedState;

    this.logger.info(`Queue flush completed: ${processed} items processed`, {
      operation: 'queue_flush',
      metadata: { processed, remaining: this.queue.length }
    });

    return processed;
  }

  size(): number {
    return this.queue.length;
  }

  // Get items by status
  getPendingItems(): QueueItem[] {
    return this.queue.filter(item => item.nextRetry <= new Date());
  }

  getRetryingItems(): QueueItem[] {
    return this.queue.filter(item => item.nextRetry > new Date());
  }

  getItemsByOperation(operation: string): QueueItem[] {
    return this.queue.filter(item => item.operation === operation);
  }
}

class PersistentQueue extends MemoryQueue {
  private persistPath: string;
  private saveTimer: NodeJS.Timeout | null = null;

  constructor(config: QueueConfig, logger: GlobalLogger, persistPath?: string) {
    super(config, logger);
    this.persistPath = persistPath || path.join(process.cwd(), 'queue_data.json');

    if (config.persistToDisk) {
      this.loadFromDisk();
      this.setupPeriodicSave();
    }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(this.persistPath)) {
        const data = fs.readFileSync(this.persistPath, 'utf8');
        const savedQueue = JSON.parse(data);

        // Restore queue items with proper Date objects
        (this as any).queue = savedQueue.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          nextRetry: new Date(item.nextRetry)
        }));

        this.logger.info(`Loaded ${(this as any).queue.length} items from persistent storage`, {
          operation: 'queue_load',
          metadata: { path: this.persistPath, count: (this as any).queue.length }
        });
      }
    } catch (error) {
      this.logger.error('Failed to load queue from disk', error as Error, {
        operation: 'queue_load_error',
        metadata: { path: this.persistPath }
      });
    }
  }

  private setupPeriodicSave(): void {
    this.saveTimer = setInterval(() => {
      this.saveToDisk();
    }, this.config.flushInterval || 10000);
  }

  private saveToDisk(): void {
    if (!this.config.persistToDisk) return;

    try {
      const queueData = JSON.stringify((this as any).queue, null, 2);
      fs.writeFileSync(this.persistPath, queueData);

      this.logger.debug(`Queue persisted to disk: ${(this as any).queue.length} items`, {
        operation: 'queue_persist',
        metadata: { path: this.persistPath, count: (this as any).queue.length }
      });
    } catch (error) {
      this.logger.error('Failed to persist queue to disk', error as Error, {
        operation: 'queue_persist_error',
        metadata: { path: this.persistPath }
      });
    }
  }

  async add(operation: string, data: any, priority = 5): Promise<string> {
    const id = await super.add(operation, data, priority);

    if (this.config.persistToDisk) {
      // Save immediately for critical operations
      if (priority >= 8) {
        this.saveToDisk();
      }
    }

    return id;
  }

  cleanup(): void {
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
    }

    if (this.config.persistToDisk) {
      this.saveToDisk();
    }
  }
}

export class QueueManager {
  private queue: QueueInterface;
  private logger: GlobalLogger;
  private config: QueueConfig;
  private isOnline = true;

  constructor(config: QueueConfig, logger: GlobalLogger) {
    this.config = config;
    this.logger = logger;

    this.queue = config.persistToDisk
      ? new PersistentQueue(config, logger)
      : new MemoryQueue(config, logger);

    this.setupNetworkMonitoring();
    this.logger.info('Queue manager initialized', {
      operation: 'queue_init',
      metadata: { persistent: config.persistToDisk, maxSize: config.maxSize }
    });
  }

  private setupNetworkMonitoring(): void {
    // Monitor network status (simplified implementation)
    setInterval(() => {
      this.checkNetworkStatus();
    }, 5000);
  }

  private async checkNetworkStatus(): Promise<void> {
    // Simple network check - in production you might want something more sophisticated
    try {
      // This could be a ping to your database or external service
      const wasOnline = this.isOnline;
      // Assume online for now - implement actual network check
      this.isOnline = true;

      if (!wasOnline && this.isOnline) {
        this.logger.info('Network connection restored, processing queued operations');
        this.queue.resume();
        await this.queue.process();
      } else if (wasOnline && !this.isOnline) {
        this.logger.warn('Network connection lost, operations will be queued');
      }
    } catch (error) {
      if (this.isOnline) {
        this.isOnline = false;
        this.logger.warn('Network connection lost, operations will be queued');
      }
    }
  }

  async queueOperation(operation: string, data: any, priority = 5): Promise<string> {
    if (this.isOnline) {
      // Try to execute immediately
      try {
        // Here you would normally execute the operation directly
        this.logger.debug(`Executing operation immediately: ${operation}`, {
          operation: 'direct_execution',
          metadata: { operation, priority }
        });

        // For demo purposes, we'll still queue high-priority items for reliability
        if (priority >= 8) {
          return await this.queue.add(operation, data, priority);
        }

        return 'executed_immediately';
      } catch (error) {
        this.logger.warn(`Direct execution failed for ${operation}, queuing for retry`, {
          metadata: { operation, error: (error as Error).message }
        });
        return await this.queue.add(operation, data, priority);
      }
    } else {
      // Offline mode - queue everything
      this.logger.info(`Queuing operation (offline mode): ${operation}`, {
        operation: 'offline_queue',
        metadata: { operation, priority }
      });
      return await this.queue.add(operation, data, priority);
    }
  }

  // Delegate methods to the underlying queue
  registerProcessor(operation: string, handler: (data: any) => Promise<any>, retryable = true): void {
    if (this.queue instanceof MemoryQueue || this.queue instanceof PersistentQueue) {
      this.queue.registerProcessor(operation, handler, retryable);
    }
  }

  async processQueue(): Promise<void> {
    return this.queue.process();
  }

  getStatus(): QueueStatus {
    return this.queue.getStatus();
  }

  async clearQueue(): Promise<void> {
    return this.queue.clear();
  }

  async retryItem(itemId: string): Promise<boolean> {
    return this.queue.retry(itemId);
  }

  async removeItem(itemId: string): Promise<boolean> {
    return this.queue.remove(itemId);
  }

  pauseQueue(): void {
    this.queue.pause();
  }

  resumeQueue(): void {
    this.queue.resume();
  }

  async flushQueue(): Promise<number> {
    return this.queue.flush();
  }

  getQueueSize(): number {
    return this.queue.size();
  }

  isNetworkOnline(): boolean {
    return this.isOnline;
  }

  // High-level convenience methods
  async queueDatabaseWrite(collection: string, data: any, priority = 7): Promise<string> {
    return this.queueOperation('database_write', { collection, data }, priority);
  }

  async queueCacheInvalidation(pattern: string, priority = 5): Promise<string> {
    return this.queueOperation('cache_invalidate', { pattern }, priority);
  }

  async queueApiRequest(url: string, method: string, data: any, priority = 6): Promise<string> {
    return this.queueOperation('api_request', { url, method, data }, priority);
  }

  async queueEmailSend(to: string, subject: string, body: string, priority = 4): Promise<string> {
    return this.queueOperation('email_send', { to, subject, body }, priority);
  }

  async queueReportGeneration(reportType: string, params: any, priority = 3): Promise<string> {
    return this.queueOperation('report_generation', { reportType, params }, priority);
  }

  // Health and monitoring
  async healthCheck(): Promise<{ isHealthy: boolean; status: QueueStatus; networkOnline: boolean }> {
    const status = this.getStatus();
    return {
      isHealthy: !status.paused && status.size < this.config.maxSize,
      status,
      networkOnline: this.isOnline
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up queue manager');

    if (this.queue instanceof PersistentQueue) {
      (this.queue as any).cleanup();
    }

    // Final flush
    await this.queue.flush();
  }
}

// Factory function
export function createQueueManager(config: QueueConfig, logger: GlobalLogger): QueueManager {
  return new QueueManager(config, logger);
}

export default QueueManager;

