/**
 * 🔄 DEORA Plaza - Advanced Service Worker for Offline Capabilities
 * 
 * Features:
 * - Intelligent caching strategies
 * - Background sync for offline operations
 * - Push notifications
 * - Cache management and cleanup
 */

const CACHE_NAME = 'deora-plaza-v1';
const STATIC_CACHE = 'deora-static-v1';
const DYNAMIC_CACHE = 'deora-dynamic-v1';
const API_CACHE = 'deora-api-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/offline',
  '/manifest.json',
  '/audio/success.wav',
  '/audio/warning.wav',
  '/audio/error.wav',
  '/audio/info.wav',
  // Add other critical audio files
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/auth/session',
  '/api/business-units',
  '/api/dashboard/stats',
  '/api/menu/items',
  '/api/tables',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first, then network (for static assets)
  CACHE_FIRST: 'cache-first',
  // Network first, then cache (for dynamic content)
  NETWORK_FIRST: 'network-first',
  // Stale while revalidate (for API data)
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  // Network only (for sensitive operations)
  NETWORK_ONLY: 'network-only'
};

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('🔧 Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache API endpoints
      caches.open(API_CACHE).then(cache => {
        console.log('🌐 Pre-caching API endpoints');
        return Promise.all(
          API_ENDPOINTS.map(url => 
            fetch(url).then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
            }).catch(() => {
              // Ignore errors during pre-caching
            })
          )
        );
      })
    ]).then(() => {
      console.log('✅ Service Worker installed successfully');
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('🚀 Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ Service Worker activated');
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  
  // Determine cache strategy based on request type
  if (isStaticAsset(url)) {
    return cacheFirst(request, STATIC_CACHE);
  } else if (isAPIRequest(url)) {
    return staleWhileRevalidate(request, API_CACHE);
  } else if (isDynamicContent(url)) {
    return networkFirst(request, DYNAMIC_CACHE);
  } else {
    return networkFirst(request, DYNAMIC_CACHE);
  }
}

// Cache first strategy (for static assets)
async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy (for dynamic content)
async function networkFirst(request: Request, cacheName: string): Promise<Response> {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await cache.match('/offline');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    return new Response('Offline', { status: 503 });
  }
}

// Stale while revalidate strategy (for API data)
async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => {
    // Network failed, but we might have cache
  });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Wait for network if no cache
  try {
    const response = await networkPromise;
    return response || new Response('Offline', { status: 503 });
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Helper functions
function isStaticAsset(url: URL): boolean {
  return !!url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico|wav|mp3)$/);
}

function isAPIRequest(url: URL): boolean {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/');
}

function isDynamicContent(url: URL): boolean {
  return url.pathname.startsWith('/dashboard/') || 
         url.pathname.startsWith('/customer/') ||
         url.pathname.startsWith('/qr-order/');
}

// Background sync for offline operations
self.addEventListener('sync', (event: any) => {
  console.log('🔄 Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-operations') {
    event.waitUntil(syncOfflineOperations());
  }
});

async function syncOfflineOperations() {
  try {
    // Get offline operations from IndexedDB
    const operations = await getOfflineOperations();
    
    for (const operation of operations) {
      try {
        await processOfflineOperation(operation);
        await removeOfflineOperation(operation.id);
        
        // Notify clients of successful sync
        self.clients.matchAll().then((clients: readonly Client[]) => {
          clients.forEach((client: Client) => {
            client.postMessage({
              type: 'OFFLINE_SYNC_SUCCESS',
              operation
            });
          });
        });
      } catch (error) {
        console.error('Failed to sync operation:', operation, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

async function processOfflineOperation(operation: any) {
  const { method, url, data } = operation;
  
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response;
}

// IndexedDB operations (simplified)
async function getOfflineOperations(): Promise<any[]> {
  // Implementation would use IndexedDB to retrieve queued operations
  return [];
}

async function removeOfflineOperation(id: string): Promise<void> {
  // Implementation would remove operation from IndexedDB
}

// Push notification handling
self.addEventListener('push', (event: any) => {
  console.log('📱 Push notification received');
  
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.priority === 'high',
    silent: data.priority === 'low'
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event: any) => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  const data = event.notification.data;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients: readonly WindowClient[]) => {
      // Check if app is already open
      for (const client of clients) {
        if (client.url.includes(data.url) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(data.url || '/dashboard');
      }
    })
  );
});

// Message handling from main thread
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      cacheUrls(data.urls);
      break;
      
    case 'CLEAR_CACHE':
      clearCache(data.cacheName);
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

async function cacheUrls(urls: string[]) {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.addAll(urls);
}

async function clearCache(cacheName?: string) {
  if (cacheName) {
    await caches.delete(cacheName);
  } else {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
  }
}

export {};