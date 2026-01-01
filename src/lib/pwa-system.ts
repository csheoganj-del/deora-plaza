// Progressive Web App (PWA) System for DEORA
// Provides offline capabilities, installability, and native app-like experience

import { logger, LogCategory } from './logging-system';

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'any' | 'natural' | 'landscape' | 'portrait';
  startUrl: string;
  scope: string;
  icons: PWAIcon[];
  categories: string[];
  screenshots?: PWAScreenshot[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface PWAScreenshot {
  src: string;
  sizes: string;
  type: string;
  label?: string;
}

export interface CacheConfig {
  name: string;
  version: string;
  urls: string[];
  strategy: 'cacheFirst' | 'networkFirst' | 'cacheOnly' | 'networkOnly' | 'staleWhileRevalidate';
}

export class PWAManager {
  private static instance: PWAManager;
  private config: PWAConfig;
  private cacheConfigs: CacheConfig[] = [];
  private isOnline: boolean = true;
  private deferredPrompt: any = null;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeCacheConfigs();
    this.setupEventListeners();
  }

  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }

  // Get default PWA configuration
  private getDefaultConfig(): PWAConfig {
    return {
      name: 'DEORA Point of Sale',
      shortName: 'DEORA POS',
      description: 'Modern point of sale system for restaurants and cafes',
      themeColor: '#1a1a1a',
      backgroundColor: '#f8f8f8',
      display: 'standalone',
      orientation: 'any',
      startUrl: '/',
      scope: '/',
      icons: [
        {
          src: '/icons/icon-72x72.png',
          sizes: '72x72',
          type: 'image/png'
        },
        {
          src: '/icons/icon-96x96.png',
          sizes: '96x96',
          type: 'image/png'
        },
        {
          src: '/icons/icon-128x128.png',
          sizes: '128x128',
          type: 'image/png'
        },
        {
          src: '/icons/icon-144x144.png',
          sizes: '144x144',
          type: 'image/png'
        },
        {
          src: '/icons/icon-152x152.png',
          sizes: '152x152',
          type: 'image/png'
        },
        {
          src: '/icons/icon-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icons/icon-384x384.png',
          sizes: '384x384',
          type: 'image/png'
        },
        {
          src: '/icons/icon-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ],
      categories: ['business', 'productivity', 'utilities']
    };
  }

  // Initialize cache configurations
  private initializeCacheConfigs(): void {
    this.cacheConfigs = [
      {
        name: 'static-cache',
        version: 'v1',
        urls: [
          '/',
          '/dashboard',
          '/offline',
          '/manifest.json',
          '/_next/static/css/',
          '/_next/static/js/',
          '/icons/'
        ],
        strategy: 'cacheFirst'
      },
      {
        name: 'api-cache',
        version: 'v1',
        urls: ['/api/menu', '/api/orders', '/api/bills'],
        strategy: 'networkFirst'
      },
      {
        name: 'image-cache',
        version: 'v1',
        urls: ['/images/', '/api/images'],
        strategy: 'cacheFirst'
      }
    ];
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      // Online/offline detection
      window.addEventListener('online', () => {
        this.isOnline = true;
        logger.info('App is online', LogCategory.SYSTEM);
        this.syncOfflineData();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        logger.warn('App is offline', LogCategory.SYSTEM);
      });

      // Install prompt
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        this.deferredPrompt = e;
        logger.info('Install prompt ready', LogCategory.SYSTEM);
      });

      // App installed
      window.addEventListener('appinstalled', () => {
        logger.info('App installed successfully', LogCategory.SYSTEM);
        this.deferredPrompt = null;
      });
    }
  }

  // Generate Web App Manifest
  generateManifest(): PWAConfig {
    return this.config;
  }

  // Create service worker
  generateServiceWorker(): string {
    const cacheConfigs = this.cacheConfigs;
    
    return `
// Service Worker for DEORA PWA
const CACHE_VERSION = 'v1';
const STATIC_CACHE = 'static-cache-v1';
const API_CACHE = 'api-cache-v1';
const IMAGE_CACHE = 'image-cache-v1';

// Cache configurations
const CACHE_CONFIGS = ${JSON.stringify(cacheConfigs, null, 2)};

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll([
          '/',
          '/dashboard',
          '/offline',
          '/manifest.json'
        ]);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && 
              cacheName !== API_CACHE && 
              cacheName !== IMAGE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Handle different request types
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(handleAPIRequest(request));
    } else if (url.pathname.startsWith('/images/') || 
               url.pathname.startsWith('/icons/')) {
      event.respondWith(handleImageRequest(request));
    } else {
      event.respondWith(handleStaticRequest(request));
    }
  }
});

// Handle API requests
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }
  
  // Return offline page or error
  return new Response(JSON.stringify({ 
    error: 'Offline - No cached data available' 
  }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Handle image requests
async function handleImageRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      cache.put(request, networkResponseclone());
      return networkResponse;
    }
  } catch (error) {
    // Return same
  }

  
  return new Response('Image not available offline', { status: 404 });
}

// Handle static requests
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }
  }
  
  return new Response('Resource not available offline', { status: 404 });
}

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOfflineOrders());
  }
});

// Sync offline orders
async function syncOfflineOrders() {
  const offlineOrders = await getOfflineOrders();
  
  for (const order of offlineOrders) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
      
      if (response.ok) {
        await removeOfflineOrder(order.id);
      }
    } catch (error) {
      console.error('Failed to sync order:', error);
    }
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data.text(),
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'deora-notification',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'View Order'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('DEORA POS', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Helper functions for offline storage
async function getOfflineOrders() {
  // Implementation would depend on your offline storage solution
  return [];
}

async function removeOfflineOrder(orderId) {
  // Implementation would depend on your offline storage solution
}
    `;
  }

  // Show install prompt
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      logger.warn('Install prompt not available', LogCategory.SYSTEM);
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        logger.info('User accepted install prompt', LogCategory.SYSTEM);
        return true;
      } else {
        logger.info('User dismissed install prompt', LogCategory.SYSTEM);
        return false;
      }
    } catch (error) {
      logger.error('Failed to show install prompt', error as Error, LogCategory.SYSTEM);
      return false;
    } finally {
      this.deferredPrompt = null;
    }
  }

  // Check if app is installed
  isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone ||
           document.referrer.includes('android-app://');
  }

  // Get installability status
  getInstallabilityStatus(): {
    isInstallable: boolean;
    isInstalled: boolean;
    platform?: string;
  } {
    return {
      isInstallable: !!this.deferredPrompt,
      isInstalled: this.isInstalled(),
      platform: this.getPlatform()
    };
  }

  // Get platform information
  private getPlatform(): string {
    if (typeof window === 'undefined') return 'unknown';
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('android')) return 'android';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) return 'ios';
    if (userAgent.includes('windows')) return 'windows';
    if (userAgent.includes('mac')) return 'macos';
    if (userAgent.includes('linux')) return 'linux';
    
    return 'unknown';
  }

  // Store data for offline sync
  async storeOfflineData(type: string, data: any): Promise<void> {
    try {
      const offlineData = this.getOfflineStorage();
      offlineData[type] = offlineData[type] || [];
      offlineData[type].push({
        ...data,
        timestamp: new Date().toISOString(),
        synced: false
      });
      
      localStorage.setItem('deora_offline_data', JSON.stringify(offlineData));
      
      logger.debug('Data stored for offline sync', {
        type,
        dataSize: JSON.stringify(data).length
      });
    } catch (error) {
      logger.error('Failed to store offline data', error as Error, LogCategory.SYSTEM);
    }
  }

  // Get offline storage data
  private getOfflineStorage(): any {
    try {
      const stored = localStorage.getItem('deora_offline_data');
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      return {};
    }
  }

  // Sync offline data when online
  private async syncOfflineData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      const offlineData = this.getOfflineStorage();
      const syncPromises: Promise<void>[] = [];

      Object.entries(offlineData).forEach(([type, items]) => {
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            if (!item.synced) {
              syncPromises.push(this.syncDataItem(type, item));
            }
          });
        }
      });

      await Promise.allSettled(syncPromises);
      
      // Clear synced items
      Object.keys(offlineData).forEach(type => {
        offlineData[type] = (offlineData[type] as any[]).filter(item => !item.synced);
      });
      
      localStorage.setItem('deora_offline_data', JSON.stringify(offlineData));
      
      logger.info('Offline data sync completed', LogCategory.SYSTEM);
    } catch (error) {
      logger.error('Failed to sync offline data', error as Error, LogCategory.SYSTEM);
    }
  }

  // Sync individual data item
  private async syncDataItem(type: string, item: any): Promise<void> {
    try {
      let endpoint = '';
      
      switch (type) {
        case 'orders':
          endpoint = '/api/orders';
          break;
        case 'bills':
          endpoint = '/api/bills';
          break;
        case 'menu_items':
          endpoint = '/api/menu';
          break;
        default:
          logger.warn('Unknown offline data type', LogCategory.SYSTEM, { type });
          return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });

      if (response.ok) {
        item.synced = true;
        logger.debug('Data item synced successfully', {
          type,
          itemId: item.id
        });
      }
    } catch (error) {
      logger.error('Failed to sync data item', error as Error, LogCategory.SYSTEM, {
        type,
        itemId: item.id
      });
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      
      logger.info('Notification permission requested', LogCategory.SYSTEM, {
        granted
      });
      
      return granted;
    } catch (error) {
      logger.error('Failed to request notification permission', error as Error, LogCategory.SYSTEM);
      return false;
    }
  }

  // Show notification
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      await this.requestNotificationPermission();
    }

    if (Notification.permission === 'granted') {
      try {
        await new Notification(title, {
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          ...options
        });
      } catch (error) {
        logger.error('Failed to show notification', error as Error, LogCategory.SYSTEM);
      }
    }
  }

  // Get connection status
  getConnectionStatus(): {
    isOnline: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  } {
    const status: any = {
      isOnline: this.isOnline
    };

    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection;
      status.effectiveType = connection.effectiveType;
      status.downlink = connection.downlink;
      status.rtt = connection.rtt;
    }

    return status;
  }

  // Update configuration
  updateConfig(newConfig: Partial<PWAConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    logger.info('PWA configuration updated', LogCategory.SYSTEM);
  }

  // Get current configuration
  getConfig(): PWAConfig {
    return { ...this.config };
  }

  // Generate PWA report
  generateReport(): {
    timestamp: Date;
    installability: any;
    connection: any;
    cacheStats: any;
    recommendations: string[];
  } {
    const installability = this.getInstallabilityStatus();
    const connection = this.getConnectionStatus();
    const offlineData = this.getOfflineStorage();
    
    const cacheStats = {
      offlineDataTypes: Object.keys(offlineData),
      totalOfflineItems: Object.values(offlineData).reduce((sum: number, items: any) => 
        sum + (Array.isArray(items) ? items.length : 0), 0)
    };

    const recommendations = this.generateRecommendations(installability, connection);

    return {
      timestamp: new Date(),
      installability,
      connection,
      cacheStats,
      recommendations
    };
  }

  // Generate recommendations
  private generateRecommendations(installability: any, connection: any): string[] {
    const recommendations: string[] = [];

    if (!installability.isInstalled && installability.isInstallable) {
      recommendations.push('App can be installed - consider showing install prompt');
    }

    if (!installability.isInstallable) {
      recommendations.push('Check PWA requirements for installability');
    }

    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      recommendations.push('Consider optimizing for slow connections');
    }

    if (!this.isOnline) {
      recommendations.push('App is offline - ensure critical features work offline');
    }

    return recommendations;
  }
}

// Export singleton instance
export const pwaManager = PWAManager.getInstance();

// Utility functions
export const showInstallPrompt = () => pwaManager.showInstallPrompt();
export const isAppInstalled = () => pwaManager.isInstalled();
export const requestNotificationPermission = () => pwaManager.requestNotificationPermission();
export const showNotification = (title: string, options?: NotificationOptions) => 
  pwaManager.showNotification(title, options);

export default pwaManager;

