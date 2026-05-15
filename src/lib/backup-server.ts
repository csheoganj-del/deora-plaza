export interface BackupServer {
  id: string;
  name: string;
  url: string;
  region: string;
  status: 'active' | 'inactive' | 'syncing' | 'failed';
  lastSync: string;
  dataVolume: number; // in GB
  capacity: number; // in GB
  latency: number; // in ms
  encryptionEnabled: boolean;
  compressionEnabled: boolean;
}

export interface BackupJob {
  id: string;
  sourceServer: string;
  targetServer: string;
  dataType: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  progress: number; // 0-100
  dataSize: number; // in MB
  error?: string;
}

export interface ReplicationRule {
  id: string;
  sourceType: 'orders' | 'inventory' | 'customers' | 'staff' | 'all';
  targetServers: string[];
  frequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  priority: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  retentionDays: number;
}

export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  description: string;
  rto: number; // Recovery Time Objective in minutes
  rpo: number; // Recovery Point Objective in minutes
  backupServers: string[];
  testSchedule: string;
  lastTestDate?: string;
  testResult?: 'passed' | 'failed' | 'partial';
}

class BackupServerManager {
  private static instance: BackupServerManager;
  private servers: Map<string, BackupServer> = new Map();
  private backupJobs: Map<string, BackupJob> = new Map();
  private replicationRules: Map<string, ReplicationRule> = new Map();
  private disasterRecoveryPlans: Map<string, DisasterRecoveryPlan> = new Map();
  private syncTimer: NodeJS.Timeout | null = null;
  private isPrimaryActive: boolean = true;

  private constructor() {
    this.initializeServers();
    this.initializeReplicationRules();
    this.initializeDisasterRecovery();
    this.startAutomaticBackup();
  }

  static getInstance(): BackupServerManager {
    if (!BackupServerManager.instance) {
      BackupServerManager.instance = new BackupServerManager();
    }
    return BackupServerManager.instance;
  }

  private initializeServers() {
    // Primary server
    this.addServer({
      id: 'primary_1',
      name: 'Primary Production Server',
      url: 'https://primary-api.deoraplaza.com',
      region: 'us-east-1',
      status: 'active',
      lastSync: new Date().toISOString(),
      dataVolume: 450.5,
      capacity: 1000,
      latency: 15,
      encryptionEnabled: true,
      compressionEnabled: true
    });

    // Backup servers
    this.addServer({
      id: 'backup_1',
      name: 'Backup Server - US West',
      url: 'https://backup-west.deoraplaza.com',
      region: 'us-west-1',
      status: 'active',
      lastSync: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
      dataVolume: 425.3,
      capacity: 800,
      latency: 45,
      encryptionEnabled: true,
      compressionEnabled: true
    });

    this.addServer({
      id: 'backup_2',
      name: 'Backup Server - Europe',
      url: 'https://backup-eu.deoraplaza.com',
      region: 'eu-west-1',
      status: 'active',
      lastSync: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
      dataVolume: 380.7,
      capacity: 600,
      latency: 120,
      encryptionEnabled: true,
      compressionEnabled: true
    });

    this.addServer({
      id: 'backup_3',
      name: 'Cold Storage - Asia',
      url: 'https://cold-storage-asia.deoraplaza.com',
      region: 'ap-southeast-1',
      status: 'active',
      lastSync: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      dataVolume: 350.2,
      capacity: 500,
      latency: 250,
      encryptionEnabled: true,
      compressionEnabled: true
    });
  }

  private initializeReplicationRules() {
    this.addReplicationRule({
      id: 'orders_realtime',
      sourceType: 'orders',
      targetServers: ['backup_1', 'backup_2'],
      frequency: 'real-time',
      priority: 'critical',
      enabled: true,
      retentionDays: 30
    });

    this.addReplicationRule({
      id: 'customers_hourly',
      sourceType: 'customers',
      targetServers: ['backup_1', 'backup_2', 'backup_3'],
      frequency: 'hourly',
      priority: 'high',
      enabled: true,
      retentionDays: 90
    });

    this.addReplicationRule({
      id: 'inventory_daily',
      sourceType: 'inventory',
      targetServers: ['backup_1', 'backup_2'],
      frequency: 'daily',
      priority: 'medium',
      enabled: true,
      retentionDays: 60
    });

    this.addReplicationRule({
      id: 'full_backup_weekly',
      sourceType: 'all',
      targetServers: ['backup_1', 'backup_2', 'backup_3'],
      frequency: 'weekly',
      priority: 'high',
      enabled: true,
      retentionDays: 365
    });
  }

  private initializeDisasterRecovery() {
    this.addDisasterRecoveryPlan({
      id: 'dr_plan_1',
      name: 'Primary Site Failure',
      description: 'Complete failover to backup servers in case of primary site failure',
      rto: 15, // 15 minutes
      rpo: 5, // 5 minutes
      backupServers: ['backup_1', 'backup_2'],
      testSchedule: 'weekly',
      lastTestDate: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      testResult: 'passed'
    });

    this.addDisasterRecoveryPlan({
      id: 'dr_plan_2',
      name: 'Regional Disaster',
      description: 'Multi-region failover in case of regional disaster',
      rto: 30, // 30 minutes
      rpo: 60, // 1 hour
      backupServers: ['backup_2', 'backup_3'],
      testSchedule: 'monthly',
      lastTestDate: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
      testResult: 'passed'
    });
  }

  private startAutomaticBackup() {
    this.syncTimer = setInterval(() => {
      this.processBackupJobs();
      this.checkReplicationRules();
    }, 60000); // Check every minute
  }

  private async processBackupJobs() {
    const pendingJobs = Array.from(this.backupJobs.values())
      .filter(job => job.status === 'pending' || job.status === 'running');

    for (const job of pendingJobs) {
      if (job.status === 'pending') {
        job.status = 'running';
        job.startTime = new Date().toISOString();
      }

      // Simulate backup progress
      job.progress = Math.min(job.progress + Math.random() * 20, 100);

      if (job.progress >= 100) {
        job.status = 'completed';
        job.endTime = new Date().toISOString();
        
        // Update target server's last sync
        const targetServer = this.servers.get(job.targetServer);
        if (targetServer) {
          targetServer.lastSync = job.endTime;
        }
      } else if (Math.random() < 0.05) { // 5% chance of failure
        job.status = 'failed';
        job.error = 'Connection timeout';
        job.endTime = new Date().toISOString();
      }
    }
  }

  private checkReplicationRules() {
    const now = new Date();
    
    this.replicationRules.forEach(rule => {
      if (!rule.enabled) return;

      const shouldReplicate = this.shouldReplicate(rule, now);
      
      if (shouldReplicate) {
        rule.targetServers.forEach(serverId => {
          this.createBackupJob('primary_1', serverId, 'incremental');
        });
      }
    });
  }

  private shouldReplicate(rule: ReplicationRule, now: Date): boolean {
    const lastJob = Array.from(this.backupJobs.values())
      .filter(job => 
        rule.targetServers.includes(job.targetServer) &&
        job.status === 'completed'
      )
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime())[0];

    if (!lastJob) return true;

    const lastSyncTime = new Date(lastJob.endTime!);
    const timeDiff = now.getTime() - lastSyncTime.getTime();

    switch (rule.frequency) {
      case 'real-time':
        return timeDiff > 60000; // 1 minute
      case 'hourly':
        return timeDiff > 3600000; // 1 hour
      case 'daily':
        return timeDiff > 86400000; // 24 hours
      case 'weekly':
        return timeDiff > 604800000; // 7 days
      default:
        return false;
    }
  }

  private addServer(server: BackupServer): string {
    const id = server.name.toLowerCase().replace(/\s+/g, '_');
    const newServer: BackupServer = { ...server, id };
    this.servers.set(id, newServer);
    return id;
  }

  getServer(id: string): BackupServer | undefined {
    return this.servers.get(id);
  }

  getAllServers(): BackupServer[] {
    return Array.from(this.servers.values());
  }

  getActiveServers(): BackupServer[] {
    return Array.from(this.servers.values()).filter(server => server.status === 'active');
  }

  updateServer(id: string, updates: Partial<BackupServer>): boolean {
    const server = this.servers.get(id);
    if (!server) return false;

    Object.assign(server, updates);
    return true;
  }

  deleteServer(id: string): boolean {
    return this.servers.delete(id);
  }

  createBackupJob(
    sourceServer: string,
    targetServer: string,
    dataType: BackupJob['dataType'],
    dataSize: number = Math.random() * 1000
  ): string {
    const job: BackupJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sourceServer,
      targetServer,
      dataType,
      status: 'pending',
      startTime: new Date().toISOString(),
      progress: 0,
      dataSize
    };

    this.backupJobs.set(job.id, job);
    return job.id;
  }

  getBackupJob(id: string): BackupJob | undefined {
    return this.backupJobs.get(id);
  }

  getAllBackupJobs(): BackupJob[] {
    return Array.from(this.backupJobs.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  getBackupJobsByServer(serverId: string): BackupJob[] {
    return Array.from(this.backupJobs.values())
      .filter(job => job.sourceServer === serverId || job.targetServer === serverId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  retryFailedJob(jobId: string): boolean {
    const job = this.backupJobs.get(jobId);
    if (!job || job.status !== 'failed') return false;

    job.status = 'pending';
    job.progress = 0;
    job.error = undefined;
    job.startTime = new Date().toISOString();
    job.endTime = undefined;

    return true;
  }

  private addReplicationRule(rule: ReplicationRule): string {
    const id = `${rule.sourceType}_${rule.frequency}`;
    const newRule: ReplicationRule = { ...rule, id };
    this.replicationRules.set(id, newRule);
    return id;
  }

  getReplicationRule(id: string): ReplicationRule | undefined {
    return this.replicationRules.get(id);
  }

  getAllReplicationRules(): ReplicationRule[] {
    return Array.from(this.replicationRules.values());
  }

  updateReplicationRule(id: string, updates: Partial<ReplicationRule>): boolean {
    const rule = this.replicationRules.get(id);
    if (!rule) return false;

    Object.assign(rule, updates);
    return true;
  }

  deleteReplicationRule(id: string): boolean {
    return this.replicationRules.delete(id);
  }

  private addDisasterRecoveryPlan(plan: DisasterRecoveryPlan): string {
    const id = plan.name.toLowerCase().replace(/\s+/g, '_');
    const newPlan: DisasterRecoveryPlan = { ...plan, id };
    this.disasterRecoveryPlans.set(id, newPlan);
    return id;
  }

  getDisasterRecoveryPlan(id: string): DisasterRecoveryPlan | undefined {
    return this.disasterRecoveryPlans.get(id);
  }

  getAllDisasterRecoveryPlans(): DisasterRecoveryPlan[] {
    return Array.from(this.disasterRecoveryPlans.values());
  }

  async testDisasterRecovery(planId: string): Promise<boolean> {
    const plan = this.disasterRecoveryPlans.get(planId);
    if (!plan) return false;

    console.log(`Testing disaster recovery plan: ${plan.name}`);
    
    // Simulate DR test
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.1; // 90% success rate
        
        plan.lastTestDate = new Date().toISOString();
        plan.testResult = success ? 'passed' : 'failed';
        
        resolve(success);
      }, 30000); // 30 second test
    });
  }

  async performFailover(primaryServerId: string): Promise<string | null> {
    const primaryServer = this.servers.get(primaryServerId);
    if (!primaryServer) return null;

    const backupServers = this.getActiveServers().filter(server => 
      server.id !== primaryServerId
    );

    if (backupServers.length === 0) return null;

    // Select best backup server (lowest latency, highest capacity)
    const bestBackup = backupServers.sort((a, b) => {
      const scoreA = a.latency * (1 - a.capacity / 1000);
      const scoreB = b.latency * (1 - b.capacity / 1000);
      return scoreA - scoreB;
    })[0];

    // Update server statuses
    primaryServer.status = 'inactive';
    bestBackup.status = 'active';
    this.isPrimaryActive = false;

    // Create emergency backup job
    this.createBackupJob(primaryServerId, bestBackup.id, 'full', 500);

    console.log(`Failover completed: ${primaryServer.name} -> ${bestBackup.name}`);
    return bestBackup.id;
  }

  async restoreFromBackup(backupServerId: string, targetServerId: string): Promise<boolean> {
    const backupServer = this.servers.get(backupServerId);
    const targetServer = this.servers.get(targetServerId);

    if (!backupServer || !targetServer) return false;

    console.log(`Restoring from backup: ${backupServer.name} -> ${targetServer.name}`);

    // Simulate restore process
    return new Promise((resolve) => {
      setTimeout(() => {
        targetServer.status = 'active';
        targetServer.lastSync = new Date().toISOString();
        
        this.isPrimaryActive = true;
        resolve(true);
      }, 60000); // 1 minute restore time
    });
  }

  getBackupStatus() {
    const totalServers = this.servers.size;
    const activeServers = this.getActiveServers().length;
    const totalJobs = this.backupJobs.size;
    const runningJobs = Array.from(this.backupJobs.values()).filter(job => job.status === 'running').length;
    const failedJobs = Array.from(this.backupJobs.values()).filter(job => job.status === 'failed').length;
    const completedJobs = Array.from(this.backupJobs.values()).filter(job => job.status === 'completed').length;

    const totalDataVolume = Array.from(this.servers.values())
      .reduce((sum, server) => sum + server.dataVolume, 0);
    
    const totalCapacity = Array.from(this.servers.values())
      .reduce((sum, server) => sum + server.capacity, 0);

    return {
      totalServers,
      activeServers,
      totalJobs,
      runningJobs,
      failedJobs,
      completedJobs,
      totalDataVolume,
      totalCapacity,
      utilizationRate: totalCapacity > 0 ? (totalDataVolume / totalCapacity) * 100 : 0,
      isPrimaryActive: this.isPrimaryActive,
      lastSyncTime: this.getLastSyncTime()
    };
  }

  private getLastSyncTime(): string | null {
    const syncTimes = Array.from(this.servers.values())
      .map(server => new Date(server.lastSync).getTime())
      .sort((a, b) => b - a);

    return syncTimes.length > 0 ? new Date(syncTimes[0]).toISOString() : null;
  }

  cleanupOldJobs(olderThanDays: number = 7): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const oldJobs = Array.from(this.backupJobs.entries())
      .filter(([_, job]) => 
        job.status === 'completed' && 
        job.endTime && 
        new Date(job.endTime) < cutoffDate
      );

    oldJobs.forEach(([id]) => this.backupJobs.delete(id));
    
    return oldJobs.length;
  }

  exportBackupData(): string {
    const exportData = {
      servers: Array.from(this.servers.values()),
      backupJobs: Array.from(this.backupJobs.values()),
      replicationRules: Array.from(this.replicationRules.values()),
      disasterRecoveryPlans: Array.from(this.disasterRecoveryPlans.values()),
      exportTime: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }

  importBackupData(jsonData: string): boolean {
    try {
      const importData = JSON.parse(jsonData);
      
      if (importData.servers) {
        this.servers.clear();
        importData.servers.forEach((server: BackupServer) => {
          this.servers.set(server.id, server);
        });
      }
      
      if (importData.backupJobs) {
        this.backupJobs.clear();
        importData.backupJobs.forEach((job: BackupJob) => {
          this.backupJobs.set(job.id, job);
        });
      }
      
      if (importData.replicationRules) {
        this.replicationRules.clear();
        importData.replicationRules.forEach((rule: ReplicationRule) => {
          this.replicationRules.set(rule.id, rule);
        });
      }
      
      if (importData.disasterRecoveryPlans) {
        this.disasterRecoveryPlans.clear();
        importData.disasterRecoveryPlans.forEach((plan: DisasterRecoveryPlan) => {
          this.disasterRecoveryPlans.set(plan.id, plan);
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to import backup data:', error);
      return false;
    }
  }

  // Mock data for demonstration
  loadMockData() {
    console.log('Backup server system initialized with mock data');
  }
}

export const backupServerManager = BackupServerManager.getInstance();

// Initialize mock data
backupServerManager.loadMockData();

