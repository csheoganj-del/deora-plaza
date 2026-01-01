export interface RouteNode {
  id: string;
  name: string;
  type: 'origin' | 'destination' | 'waypoint';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address?: string;
  businessUnit?: string;
  estimatedArrival?: string;
  distance?: number; // in km
  duration?: number; // in minutes
}

export interface Route {
  id: string;
  name: string;
  origin: RouteNode;
  destination: RouteNode;
  waypoints: RouteNode[];
  totalDistance: number; // in km
  totalDuration: number; // in minutes
  trafficCondition: 'light' | 'moderate' | 'heavy' | 'severe';
  routeType: 'fastest' | 'shortest' | 'scenic' | 'optimized';
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface LoadBalancer {
  id: string;
  name: string;
  algorithm: 'round_robin' | 'weighted_round_robin' | 'least_connections' | 'geographic' | 'performance_based';
  nodes: LoadBalancedNode[];
  healthCheckInterval: number; // in seconds
  sessionAffinity: boolean;
  stickySessions: boolean;
}

export interface LoadBalancedNode {
  id: string;
  nodeId: string;
  name: string;
  url: string;
  weight: number;
  currentConnections: number;
  maxConnections: number;
  responseTime: number; // in ms
  healthScore: number; // 0-100
  region: string;
  capacity: number; // 0-1
  enabled: boolean;
}

export interface TrafficData {
  nodeId: string;
  timestamp: string;
  requests: number;
  responseTime: number;
  errorRate: number;
  bandwidth: number; // in Mbps
  activeConnections: number;
}

class LocationAwareRoutingManager {
  private static instance: LocationAwareRoutingManager;
  private routes: Map<string, Route> = new Map();
  private loadBalancers: Map<string, LoadBalancer> = new Map();
  private trafficData: Map<string, TrafficData[]> = new Map();
  private routingTimer: NodeJS.Timeout | null = null;
  private currentLocation: { latitude: number; longitude: number } | null = null;

  private constructor() {
    this.initializeLoadBalancers();
    this.startTrafficMonitoring();
    this.initializeGeolocation();
  }

  static getInstance(): LocationAwareRoutingManager {
    if (!LocationAwareRoutingManager.instance) {
      LocationAwareRoutingManager.instance = new LocationAwareRoutingManager();
    }
    return LocationAwareRoutingManager.instance;
  }

  private initializeLoadBalancers() {
    // API load balancer
    this.addLoadBalancer({
      id: 'api_lb',
      name: 'API Load Balancer',
      algorithm: 'geographic',
      healthCheckInterval: 30,
      sessionAffinity: true,
      stickySessions: true,
      nodes: [
        {
          id: 'api_node_1',
          nodeId: 'primary_1',
          name: 'Primary API Server',
          url: 'https://primary-api.deoraplaza.com',
          weight: 3,
          currentConnections: 450,
          maxConnections: 500,
          responseTime: 45,
          healthScore: 95,
          region: 'us-east-1',
          capacity: 0.9,
          enabled: true
        },
        {
          id: 'api_node_2',
          nodeId: 'secondary_1',
          name: 'Secondary API Server - West',
          url: 'https://secondary-west-api.deoraplaza.com',
          weight: 2,
          currentConnections: 120,
          maxConnections: 300,
          responseTime: 78,
          healthScore: 88,
          region: 'us-west-1',
          capacity: 0.4,
          enabled: true
        },
        {
          id: 'api_node_3',
          nodeId: 'secondary_2',
          name: 'Secondary API Server - EU',
          url: 'https://secondary-eu-api.deoraplaza.com',
          weight: 1,
          currentConnections: 85,
          maxConnections: 250,
          responseTime: 120,
          healthScore: 82,
          region: 'eu-west-1',
          capacity: 0.34,
          enabled: true
        }
      ]
    });

    // CDN load balancer
    this.addLoadBalancer({
      id: 'cdn_lb',
      name: 'CDN Load Balancer',
      algorithm: 'performance_based',
      healthCheckInterval: 60,
      sessionAffinity: false,
      stickySessions: false,
      nodes: [
        {
          id: 'cdn_node_1',
          nodeId: 'cdn_us_east',
          name: 'CDN Node - US East',
          url: 'https://cdn-us-east.deoraplaza.com',
          weight: 1,
          currentConnections: 800,
          maxConnections: 1000,
          responseTime: 25,
          healthScore: 98,
          region: 'us-east-1',
          capacity: 0.8,
          enabled: true
        },
        {
          id: 'cdn_node_2',
          nodeId: 'cdn_us_west',
          name: 'CDN Node - US West',
          url: 'https://cdn-us-west.deoraplaza.com',
          weight: 1,
          currentConnections: 400,
          maxConnections: 800,
          responseTime: 35,
          healthScore: 92,
          region: 'us-west-1',
          capacity: 0.5,
          enabled: true
        },
        {
          id: 'cdn_node_3',
          nodeId: 'cdn_eu',
          name: 'CDN Node - EU',
          url: 'https://cdn-eu.deoraplaza.com',
          weight: 1,
          currentConnections: 300,
          maxConnections: 600,
          responseTime: 45,
          healthScore: 90,
          region: 'eu-west-1',
          capacity: 0.5,
          enabled: true
        },
        {
          id: 'cdn_node_4',
          nodeId: 'cdn_asia',
          name: 'CDN Node - Asia',
          url: 'https://cdn-asia.deoraplaza.com',
          weight: 1,
          currentConnections: 200,
          maxConnections: 400,
          responseTime: 65,
          healthScore: 85,
          region: 'ap-southeast-1',
          capacity: 0.5,
          enabled: true
        }
      ]
    });

    // Database load balancer
    this.addLoadBalancer({
      id: 'db_lb',
      name: 'Database Load Balancer',
      algorithm: 'least_connections',
      healthCheckInterval: 15,
      sessionAffinity: true,
      stickySessions: true,
      nodes: [
        {
          id: 'db_primary',
          nodeId: 'db_primary_1',
          name: 'Primary Database',
          url: 'https://db-primary.deoraplaza.com',
          weight: 1,
          currentConnections: 150,
          maxConnections: 200,
          responseTime: 15,
          healthScore: 96,
          region: 'us-east-1',
          capacity: 0.75,
          enabled: true
        },
        {
          id: 'db_replica_1',
          nodeId: 'db_replica_1',
          name: 'Database Replica 1',
          url: 'https://db-replica-1.deoraplaza.com',
          weight: 1,
          currentConnections: 80,
          maxConnections: 150,
          responseTime: 20,
          healthScore: 94,
          region: 'us-east-1',
          capacity: 0.53,
          enabled: true
        },
        {
          id: 'db_replica_2',
          nodeId: 'db_replica_2',
          name: 'Database Replica 2',
          url: 'https://db-replica-2.deoraplaza.com',
          weight: 1,
          currentConnections: 60,
          maxConnections: 150,
          responseTime: 25,
          healthScore: 92,
          region: 'us-west-1',
          capacity: 0.4,
          enabled: true
        }
      ]
    });
  }

  private initializeGeolocation() {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }

  private startTrafficMonitoring() {
    this.routingTimer = setInterval(() => {
      this.updateTrafficData();
      this.updateNodeHealth();
      this.optimizeRouting();
    }, 30000); // Update every 30 seconds
  }

  private updateTrafficData() {
    for (const loadBalancer of this.loadBalancers.values()) {
      for (const node of loadBalancer.nodes) {
        const trafficData: TrafficData = {
          nodeId: node.id,
          timestamp: new Date().toISOString(),
          requests: Math.floor(Math.random() * 1000),
          responseTime: node.responseTime + (Math.random() - 0.5) * 10,
          errorRate: Math.random() * 5,
          bandwidth: Math.random() * 100,
          activeConnections: node.currentConnections + Math.floor((Math.random() - 0.5) * 20)
        };

        if (!this.trafficData.has(node.id)) {
          this.trafficData.set(node.id, []);
        }

        const nodeTrafficData = this.trafficData.get(node.id)!;
        nodeTrafficData.push(trafficData);

        // Keep only last 100 data points
        if (nodeTrafficData.length > 100) {
          nodeTrafficData.shift();
        }

        // Update node metrics
        node.currentConnections = trafficData.activeConnections;
        node.responseTime = trafficData.responseTime;
        node.capacity = node.currentConnections / node.maxConnections;
      }
    }
  }

  private updateNodeHealth() {
    for (const loadBalancer of this.loadBalancers.values()) {
      for (const node of loadBalancer.nodes) {
        if (!node.enabled) continue;

        // Calculate health score based on multiple factors
        let healthScore = 100;

        // Response time impact (40% weight)
        if (node.responseTime > 1000) healthScore -= 40;
        else if (node.responseTime > 500) healthScore -= 25;
        else if (node.responseTime > 200) healthScore -= 10;

        // Capacity impact (30% weight)
        if (node.capacity > 0.9) healthScore -= 30;
        else if (node.capacity > 0.8) healthScore -= 20;
        else if (node.capacity > 0.7) healthScore -= 10;

        // Error rate impact (30% weight)
        const recentTraffic = this.getRecentTrafficData(node.id, 5);
        if (recentTraffic.length > 0) {
          const avgErrorRate = recentTraffic.reduce((sum, data) => sum + data.errorRate, 0) / recentTraffic.length;
          if (avgErrorRate > 5) healthScore -= 30;
          else if (avgErrorRate > 2) healthScore -= 15;
          else if (avgErrorRate > 1) healthScore -= 5;
        }

        node.healthScore = Math.max(0, Math.min(100, healthScore));

        // Disable node if health score is too low
        if (node.healthScore < 30) {
          node.enabled = false;
        } else if (node.healthScore > 70 && !node.enabled) {
          node.enabled = true;
        }
      }
    }
  }

  private optimizeRouting() {
    for (const loadBalancer of this.loadBalancers.values()) {
      // Update weights based on performance
      if (loadBalancer.algorithm === 'performance_based') {
        const maxHealthScore = Math.max(...loadBalancer.nodes.map(node => node.healthScore));
        
        loadBalancer.nodes.forEach(node => {
          if (node.enabled) {
            node.weight = Math.max(1, Math.floor((node.healthScore / maxHealthScore) * 10));
          }
        });
      }
    }
  }

  private getRecentTrafficData(nodeId: string, minutes: number): TrafficData[] {
    const data = this.trafficData.get(nodeId) || [];
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - minutes);

    return data.filter(traffic => new Date(traffic.timestamp) >= cutoffTime);
  }

  private addLoadBalancer(loadBalancer: LoadBalancer): string {
    const id = loadBalancer.name.toLowerCase().replace(/\s+/g, '_');
    const newLoadBalancer: LoadBalancer = { ...loadBalancer, id };
    this.loadBalancers.set(id, newLoadBalancer);
    return id;
  }

  getLoadBalancer(id: string): LoadBalancer | undefined {
    return this.loadBalancers.get(id);
  }

  getAllLoadBalancers(): LoadBalancer[] {
    return Array.from(this.loadBalancers.values());
  }

  selectOptimalNode(loadBalancerId: string, userLocation?: { latitude: number; longitude: number }): LoadBalancedNode | null {
    const loadBalancer = this.loadBalancers.get(loadBalancerId);
    if (!loadBalancer) return null;

    const enabledNodes = loadBalancer.nodes.filter(node => node.enabled);
    if (enabledNodes.length === 0) return null;

    switch (loadBalancer.algorithm) {
      case 'round_robin':
        return this.selectRoundRobin(enabledNodes);
      
      case 'weighted_round_robin':
        return this.selectWeightedRoundRobin(enabledNodes);
      
      case 'least_connections':
        return this.selectLeastConnections(enabledNodes);
      
      case 'geographic':
        return this.selectGeographic(enabledNodes, userLocation || this.currentLocation);
      
      case 'performance_based':
        return this.selectPerformanceBased(enabledNodes);
      
      default:
        return enabledNodes[0];
    }
  }

  private selectRoundRobin(nodes: LoadBalancedNode[]): LoadBalancedNode {
    // Simple round-robin based on current connections
    return nodes.reduce((min, node) => 
      node.currentConnections < min.currentConnections ? node : min
    );
  }

  private selectWeightedRoundRobin(nodes: LoadBalancedNode[]): LoadBalancedNode {
    const totalWeight = nodes.reduce((sum, node) => sum + node.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const node of nodes) {
      random -= node.weight;
      if (random <= 0) {
        return node;
      }
    }
    
    return nodes[0];
  }

  private selectLeastConnections(nodes: LoadBalancedNode[]): LoadBalancedNode {
    return nodes.reduce((min, node) => 
      node.currentConnections < min.currentConnections ? node : min
    );
  }

  private selectGeographic(
    nodes: LoadBalancedNode[], 
    userLocation: { latitude: number; longitude: number } | null
  ): LoadBalancedNode {
    if (!userLocation) {
      return this.selectLeastConnections(nodes);
    }

    let closestNode = nodes[0];
    let minDistance = this.calculateDistance(
      userLocation.latitude,
      userLocation.longitude,
      this.getNodeCoordinates(closestNode.region).latitude,
      this.getNodeCoordinates(closestNode.region).longitude
    );

    for (let i = 1; i < nodes.length; i++) {
      const nodeCoords = this.getNodeCoordinates(nodes[i].region);
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        nodeCoords.latitude,
        nodeCoords.longitude
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestNode = nodes[i];
      }
    }

    return closestNode;
  }

  private selectPerformanceBased(nodes: LoadBalancedNode[]): LoadBalancedNode {
    // Calculate performance score
    return nodes.reduce((best, node) => {
      const bestScore = (best.healthScore * 0.6) + ((1 - best.capacity) * 40);
      const nodeScore = (node.healthScore * 0.6) + ((1 - node.capacity) * 40);
      return nodeScore > bestScore ? node : best;
    });
  }

  private getNodeCoordinates(region: string): { latitude: number; longitude: number } {
    const coordinates: { [key: string]: { latitude: number; longitude: number } } = {
      'us-east-1': { latitude: 40.7128, longitude: -74.0060 },
      'us-west-1': { latitude: 37.7749, longitude: -122.4194 },
      'eu-west-1': { latitude: 51.5074, longitude: -0.1278 },
      'ap-southeast-1': { latitude: 1.3521, longitude: 103.8198 }
    };

    return coordinates[region] || { latitude: 0, longitude: 0 };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  createRoute(
    name: string,
    origin: Omit<RouteNode, 'id'>,
    destination: Omit<RouteNode, 'id'>,
    waypoints: Omit<RouteNode, 'id'>[] = [],
    routeType: Route['routeType'] = 'fastest'
  ): string {
    const route: Route = {
      id: `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      origin: { ...origin, id: 'origin', type: 'origin' },
      destination: { ...destination, id: 'destination', type: 'destination' },
      waypoints: waypoints.map((wp, index) => ({ ...wp, id: `waypoint_${index}`, type: 'waypoint' })),
      totalDistance: this.calculateRouteDistance(origin.coordinates, destination.coordinates, waypoints),
      totalDuration: this.calculateRouteDuration(origin.coordinates, destination.coordinates, waypoints),
      trafficCondition: 'moderate',
      routeType,
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    this.routes.set(route.id, route);
    return route.id;
  }

  private calculateRouteDistance(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    waypoints: { coordinates: { latitude: number; longitude: number } }[] = []
  ): number {
    let totalDistance = 0;
    let previousPoint = origin;

    for (const waypoint of waypoints) {
      totalDistance += this.calculateDistance(
        previousPoint.latitude,
        previousPoint.longitude,
        waypoint.coordinates.latitude,
        waypoint.coordinates.longitude
      );
      previousPoint = waypoint.coordinates;
    }

    totalDistance += this.calculateDistance(
      previousPoint.latitude,
      previousPoint.longitude,
      destination.latitude,
      destination.longitude
    );

    return Math.round(totalDistance * 10) / 10;
  }

  private calculateRouteDuration(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
    waypoints: { coordinates: { latitude: number; longitude: number } }[] = []
  ): number {
    const distance = this.calculateRouteDistance(origin, destination, waypoints);
    const averageSpeed = 60; // km/h
    
    return Math.round((distance / averageSpeed) * 60); // Convert to minutes
  }

  getRoute(id: string): Route | undefined {
    return this.routes.get(id);
  }

  getAllRoutes(): Route[] {
    return Array.from(this.routes.values());
  }

  getRoutesByStatus(status: Route['status']): Route[] {
    return Array.from(this.routes.values()).filter(route => route.status === status);
  }

  updateRoute(id: string, updates: Partial<Route>): boolean {
    const route = this.routes.get(id);
    if (!route) return false;

    Object.assign(route, updates);
    return true;
  }

  deleteRoute(id: string): boolean {
    return this.routes.delete(id);
  }

  getTrafficData(nodeId: string, hours: number = 24): TrafficData[] {
    const data = this.trafficData.get(nodeId) || [];
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hours);

    return data.filter(traffic => new Date(traffic.timestamp) >= cutoffTime);
  }

  getRoutingMetrics() {
    const totalNodes = Array.from(this.loadBalancers.values())
      .reduce((sum, lb) => sum + lb.nodes.length, 0);
    
    const activeNodes = Array.from(this.loadBalancers.values())
      .reduce((sum, lb) => sum + lb.nodes.filter(node => node.enabled).length, 0);

    const totalConnections = Array.from(this.loadBalancers.values())
      .reduce((sum, lb) => sum + lb.nodes.reduce((nodeSum, node) => nodeSum + node.currentConnections, 0), 0);

    const avgResponseTime = Array.from(this.loadBalancers.values())
      .reduce((sum, lb) => sum + lb.nodes.reduce((nodeSum, node) => nodeSum + node.responseTime, 0), 0) / totalNodes;

    const avgHealthScore = Array.from(this.loadBalancers.values())
      .reduce((sum, lb) => sum + lb.nodes.reduce((nodeSum, node) => nodeSum + node.healthScore, 0), 0) / totalNodes;

    return {
      totalLoadBalancers: this.loadBalancers.size,
      totalNodes,
      activeNodes,
      totalConnections,
      avgResponseTime,
      avgHealthScore,
      currentLocation: this.currentLocation
    };
  }

  updateLoadBalancerNode(
    loadBalancerId: string,
    nodeId: string,
    updates: Partial<LoadBalancedNode>
  ): boolean {
    const loadBalancer = this.loadBalancers.get(loadBalancerId);
    if (!loadBalancer) return false;

    const node = loadBalancer.nodes.find(n => n.id === nodeId);
    if (!node) return false;

    Object.assign(node, updates);
    return true;
  }

  stopMonitoring(): void {
    if (this.routingTimer) {
      clearInterval(this.routingTimer);
      this.routingTimer = null;
    }
  }

  // Mock data for demonstration
  loadMockData() {
    console.log('Location-aware routing system initialized with mock data');
  }
}

export const locationAwareRoutingManager = LocationAwareRoutingManager.getInstance();

// Initialize without mock data
locationAwareRoutingManager;

