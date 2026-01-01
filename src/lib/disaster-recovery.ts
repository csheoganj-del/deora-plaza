export interface DisasterRecoveryPlan {
  id: string;
  name: string;
  description: string;
  disasterTypes: ('natural' | 'cyber' | 'hardware' | 'software' | 'human_error')[];
  rto: number; // Recovery Time Objective in minutes
  rpo: number; // Recovery Point Objective in minutes
  priority: 'critical' | 'high' | 'medium' | 'low';
  backupServers: string[];
  recoverySteps: RecoveryStep[];
  testSchedule: string;
  lastTestDate?: string;
  lastTestResult?: 'passed' | 'failed' | 'partial';
  nextTestDate?: string;
  contactPersonnel: ContactPerson[];
  documentation: string[];
  isActive: boolean;
}

export interface RecoveryStep {
  id: string;
  sequence: number;
  title: string;
  description: string;
  type: 'assessment' | 'communication' | 'technical' | 'verification';
  estimatedDuration: number; // in minutes
  dependencies: string[]; // step IDs that must complete first
  assignedTo?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  actualDuration?: number;
  notes?: string;
}

export interface ContactPerson {
  id: string;
  name: string;
  role: string;
  department: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  isOnCall: boolean;
}

export interface BackupSnapshot {
  id: string;
  name: string;
  timestamp: string;
  type: 'full' | 'incremental' | 'differential';
  size: number; // in GB
  location: string;
  checksum: string;
  isEncrypted: boolean;
  retentionDate: string;
  status: 'available' | 'corrupted' | 'archived';
}

export interface RecoveryExecution {
  id: string;
  planId: string;
  triggeredBy: 'automatic' | 'manual';
  triggerReason: string;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  currentStep?: string;
  completedSteps: string[];
  failedSteps: string[];
  dataLoss: number; // in minutes
  downtime: number; // in minutes
  cost: number; // in USD
  lessonsLearned: string[];
}

class DisasterRecoveryManager {
  private static instance: DisasterRecoveryManager;
  private plans: Map<string, DisasterRecoveryPlan> = new Map();
  private executions: Map<string, RecoveryExecution> = new Map();
  private snapshots: Map<string, BackupSnapshot> = new Map();
  private testTimer: NodeJS.Timeout | null = null;
  private isRecoveryActive: boolean = false;

  private constructor() {
    this.initializePlans();
    this.initializeSnapshots();
    this.startTestScheduler();
  }

  static getInstance(): DisasterRecoveryManager {
    if (!DisasterRecoveryManager.instance) {
      DisasterRecoveryManager.instance = new DisasterRecoveryManager();
    }
    return DisasterRecoveryManager.instance;
  }

  private initializePlans() {
    // Primary site disaster recovery
    this.addPlan({
      id: 'primary_site_dr',
      name: 'Primary Site Complete Failure',
      description: 'Complete recovery plan for primary data center failure',
      disasterTypes: ['natural', 'cyber', 'hardware'],
      rto: 30, // 30 minutes
      rpo: 5, // 5 minutes
      priority: 'critical',
      backupServers: ['backup_1', 'backup_2'],
      recoverySteps: [
        {
          id: 'assess_situation',
          sequence: 1,
          title: 'Assess Disaster Impact',
          description: 'Evaluate the extent of the disaster and affected systems',
          type: 'assessment',
          estimatedDuration: 5,
          dependencies: [],
          status: 'pending'
        },
        {
          id: 'notify_stakeholders',
          sequence: 2,
          title: 'Notify Key Stakeholders',
          description: 'Inform management, IT team, and business units about the disaster',
          type: 'communication',
          estimatedDuration: 10,
          dependencies: ['assess_situation'],
          status: 'pending'
        },
        {
          id: 'activate_backup',
          sequence: 3,
          title: 'Activate Backup Systems',
          description: 'Bring backup servers online and verify connectivity',
          type: 'technical',
          estimatedDuration: 15,
          dependencies: ['assess_situation'],
          status: 'pending'
        },
        {
          id: 'restore_data',
          sequence: 4,
          title: 'Restore Latest Backup',
          description: 'Restore data from the most recent valid backup snapshot',
          type: 'technical',
          estimatedDuration: 20,
          dependencies: ['activate_backup'],
          status: 'pending'
        },
        {
          id: 'verify_services',
          sequence: 5,
          title: 'Verify Service Availability',
          description: 'Test all critical services and ensure they are functioning',
          type: 'verification',
          estimatedDuration: 10,
          dependencies: ['restore_data'],
          status: 'pending'
        },
        {
          id: 'notify_completion',
          sequence: 6,
          title: 'Notify Recovery Completion',
          description: 'Inform all stakeholders that recovery is complete',
          type: 'communication',
          estimatedDuration: 5,
          dependencies: ['verify_services'],
          status: 'pending'
        }
      ],
      testSchedule: 'weekly',
      lastTestDate: new Date(Date.now() - 604800000).toISOString(), // 1 week ago
      lastTestResult: 'passed',
      contactPersonnel: [
        {
          id: 'contact_1',
          name: 'John Smith',
          role: 'IT Director',
          department: 'IT',
          phone: '+1-555-0101',
          email: 'john.smith@deoraplaza.com',
          isPrimary: true,
          isOnCall: true
        },
        {
          id: 'contact_2',
          name: 'Sarah Johnson',
          role: 'System Administrator',
          department: 'IT',
          phone: '+1-555-0102',
          email: 'sarah.johnson@deoraplaza.com',
          isPrimary: false,
          isOnCall: true
        }
      ],
      documentation: [
        'dr_procedure_manual.pdf',
        'network_diagram.pdf',
        'backup_procedure.pdf'
      ],
      isActive: true
    });

    // Cybersecurity incident recovery
    this.addPlan({
      id: 'cyber_incident_dr',
      name: 'Cybersecurity Incident Response',
      description: 'Recovery plan for security breaches and cyber attacks',
      disasterTypes: ['cyber'],
      rto: 60, // 1 hour
      rpo: 15, // 15 minutes
      priority: 'critical',
      backupServers: ['backup_1'],
      recoverySteps: [
        {
          id: 'isolate_systems',
          sequence: 1,
          title: 'Isolate Affected Systems',
          description: 'Disconnect compromised systems from the network',
          type: 'technical',
          estimatedDuration: 10,
          dependencies: [],
          status: 'pending'
        },
        {
          id: 'assess_breach',
          sequence: 2,
          title: 'Assess Security Breach',
          description: 'Determine the scope and impact of the security incident',
          type: 'assessment',
          estimatedDuration: 20,
          dependencies: ['isolate_systems'],
          status: 'pending'
        },
        {
          id: 'contain_threat',
          sequence: 3,
          title: 'Contain Security Threat',
          description: 'Implement measures to prevent further damage',
          type: 'technical',
          estimatedDuration: 30,
          dependencies: ['assess_breach'],
          status: 'pending'
        },
        {
          id: 'restore_clean',
          sequence: 4,
          title: 'Restore from Clean Backup',
          description: 'Restore systems from known good backup snapshots',
          type: 'technical',
          estimatedDuration: 45,
          dependencies: ['contain_threat'],
          status: 'pending'
        }
      ],
      testSchedule: 'monthly',
      lastTestDate: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
      lastTestResult: 'passed',
      contactPersonnel: [
        {
          id: 'contact_3',
          name: 'Mike Chen',
          role: 'Security Officer',
          department: 'Security',
          phone: '+1-555-0103',
          email: 'mike.chen@deoraplaza.com',
          isPrimary: true,
          isOnCall: true
        }
      ],
      documentation: [
        'security_incident_response.pdf',
        'forensic_procedures.pdf'
      ],
      isActive: true
    });
  }

  private initializeSnapshots() {
    // Recent backup snapshots
    this.addSnapshot({
      id: 'snapshot_1',
      name: 'Daily Full Backup',
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      type: 'full',
      size: 450.5,
      location: 'backup_1',
      checksum: 'abc123def456',
      isEncrypted: true,
      retentionDate: new Date(Date.now() + 25920000000).toISOString(), // 30 days from now
      status: 'available'
    });

    this.addSnapshot({
      id: 'snapshot_2',
      name: 'Hourly Incremental Backup',
      timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      type: 'incremental',
      size: 25.3,
      location: 'backup_1',
      checksum: 'def456ghi789',
      isEncrypted: true,
      retentionDate: new Date(Date.now() + 604800000).toISOString(), // 7 days from now
      status: 'available'
    });

    this.addSnapshot({
      id: 'snapshot_3',
      name: 'Daily Full Backup - EU',
      timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
      type: 'full',
      size: 425.7,
      location: 'backup_2',
      checksum: 'ghi789jkl012',
      isEncrypted: true,
      retentionDate: new Date(Date.now() + 25920000000).toISOString(), // 30 days from now
      status: 'available'
    });
  }

  private startTestScheduler() {
    this.testTimer = setInterval(() => {
      this.checkScheduledTests();
    }, 3600000); // Check every hour
  }

  private checkScheduledTests() {
    const now = new Date();
    
    this.plans.forEach(plan => {
      if (!plan.isActive) return;

      // Check if it's time for a scheduled test
      if (plan.nextTestDate && new Date(plan.nextTestDate) <= now) {
        this.scheduleTest(plan.id);
      }
    });
  }

  private addPlan(plan: DisasterRecoveryPlan): string {
    this.plans.set(plan.id, plan);
    return plan.id;
  }

  private addSnapshot(snapshot: BackupSnapshot): string {
    this.snapshots.set(snapshot.id, snapshot);
    return snapshot.id;
  }

  getPlan(id: string): DisasterRecoveryPlan | undefined {
    return this.plans.get(id);
  }

  getAllPlans(): DisasterRecoveryPlan[] {
    return Array.from(this.plans.values());
  }

  getActivePlans(): DisasterRecoveryPlan[] {
    return Array.from(this.plans.values()).filter(plan => plan.isActive);
  }

  updatePlan(id: string, updates: Partial<DisasterRecoveryPlan>): boolean {
    const plan = this.plans.get(id);
    if (!plan) return false;

    Object.assign(plan, updates);
    return true;
  }

  deletePlan(id: string): boolean {
    return this.plans.delete(id);
  }

  async executeRecoveryPlan(planId: string, triggeredBy: 'automatic' | 'manual', reason: string): Promise<string> {
    const plan = this.plans.get(planId);
    if (!plan || !plan.isActive || this.isRecoveryActive) {
      throw new Error('Cannot execute recovery plan');
    }

    const execution: RecoveryExecution = {
      id: `execution_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      planId,
      triggeredBy,
      triggerReason: reason,
      startTime: new Date().toISOString(),
      status: 'running',
      completedSteps: [],
      failedSteps: [],
      dataLoss: 0,
      downtime: 0,
      cost: 0,
      lessonsLearned: []
    };

    this.executions.set(execution.id, execution);
    this.isRecoveryActive = true;

    try {
      await this.executeRecoverySteps(plan, execution);
      
      execution.status = 'completed';
      execution.endTime = new Date().toISOString();
      execution.downtime = Math.floor((new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) / 60000);

    } catch (error) {
      execution.status = 'failed';
      execution.endTime = new Date().toISOString();
      execution.downtime = Math.floor((new Date(execution.endTime).getTime() - new Date(execution.startTime).getTime()) / 60000);
    } finally {
      this.isRecoveryActive = false;
    }

    return execution.id;
  }

  private async executeRecoverySteps(plan: DisasterRecoveryPlan, execution: RecoveryExecution): Promise<void> {
    const steps = plan.recoverySteps.sort((a, b) => a.sequence - b.sequence);

    for (const step of steps) {
      // Check dependencies
      const dependenciesMet = step.dependencies.every(depId => 
        execution.completedSteps.includes(depId)
      );

      if (!dependenciesMet) {
        execution.failedSteps.push(step.id);
        step.status = 'failed';
        continue;
      }

      execution.currentStep = step.id;
      step.status = 'in_progress';

      try {
        // Simulate step execution
        await this.executeStep(step);
        
        step.status = 'completed';
        step.actualDuration = step.estimatedDuration;
        execution.completedSteps.push(step.id);

      } catch (error) {
        step.status = 'failed';
        execution.failedSteps.push(step.id);
        throw error;
      }
    }
  }

  private async executeStep(step: RecoveryStep): Promise<void> {
    // Simulate step execution with realistic timing
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate 95% success rate
        if (Math.random() > 0.05) {
          console.log(`Step completed: ${step.title}`);
          resolve();
        } else {
          console.error(`Step failed: ${step.title}`);
          reject(new Error('Step execution failed'));
        }
      }, step.estimatedDuration * 100); // Convert minutes to milliseconds (scaled down for demo)
    });
  }

  getExecution(id: string): RecoveryExecution | undefined {
    return this.executions.get(id);
  }

  getAllExecutions(): RecoveryExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  getExecutionsByPlan(planId: string): RecoveryExecution[] {
    return Array.from(this.executions.values())
      .filter(execution => execution.planId === planId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async scheduleTest(planId: string): Promise<boolean> {
    const plan = this.plans.get(planId);
    if (!plan || !plan.isActive) return false;

    console.log(`Starting disaster recovery test for plan: ${plan.name}`);

    try {
      // Execute the plan in test mode
      const executionId = await this.executeRecoveryPlan(planId, 'automatic', 'Scheduled test');
      
      plan.lastTestDate = new Date().toISOString();
      plan.lastTestResult = 'passed';
      
      // Schedule next test based on plan frequency
      this.scheduleNextTest(plan);

      return true;
    } catch (error) {
      plan.lastTestDate = new Date().toISOString();
      plan.lastTestResult = 'failed';
      return false;
    }
  }

  private scheduleNextTest(plan: DisasterRecoveryPlan): void {
    const now = new Date();
    let nextTestDate: Date;

    switch (plan.testSchedule) {
      case 'weekly':
        nextTestDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextTestDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarterly':
        nextTestDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        nextTestDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    plan.nextTestDate = nextTestDate.toISOString();
  }

  getSnapshot(id: string): BackupSnapshot | undefined {
    return this.snapshots.get(id);
  }

  getAllSnapshots(): BackupSnapshot[] {
    return Array.from(this.snapshots.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getSnapshotsByType(type: BackupSnapshot['type']): BackupSnapshot[] {
    return Array.from(this.snapshots.values())
      .filter(snapshot => snapshot.type === type)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  getAvailableSnapshots(): BackupSnapshot[] {
    return Array.from(this.snapshots.values())
      .filter(snapshot => snapshot.status === 'available')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  createSnapshot(
    name: string,
    type: BackupSnapshot['type'],
    location: string,
    size: number
  ): string {
    const snapshot: BackupSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      timestamp: new Date().toISOString(),
      type,
      size,
      location,
      checksum: Math.random().toString(36).substr(2),
      isEncrypted: true,
      retentionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'available'
    };

    this.snapshots.set(snapshot.id, snapshot);
    return snapshot.id;
  }

  deleteSnapshot(id: string): boolean {
    return this.snapshots.delete(id);
  }

  getRecoveryMetrics() {
    const totalPlans = this.plans.size;
    const activePlans = this.getActivePlans().length;
    const totalExecutions = this.executions.size;
    const successfulExecutions = Array.from(this.executions.values())
      .filter(execution => execution.status === 'completed').length;
    const failedExecutions = Array.from(this.executions.values())
      .filter(execution => execution.status === 'failed').length;

    const totalSnapshots = this.snapshots.size;
    const availableSnapshots = this.getAvailableSnapshots().length;
    const totalBackupSize = Array.from(this.snapshots.values())
      .reduce((sum, snapshot) => sum + snapshot.size, 0);

    const avgRTO = Array.from(this.plans.values())
      .reduce((sum, plan) => sum + plan.rto, 0) / totalPlans;
    const avgRPO = Array.from(this.plans.values())
      .reduce((sum, plan) => sum + plan.rpo, 0) / totalPlans;

    const recentExecutions = this.getAllExecutions().slice(0, 10);
    const avgDowntime = recentExecutions.length > 0
      ? recentExecutions.reduce((sum, exec) => sum + exec.downtime, 0) / recentExecutions.length
      : 0;

    return {
      totalPlans,
      activePlans,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0,
      totalSnapshots,
      availableSnapshots,
      totalBackupSize,
      avgRTO,
      avgRPO,
      avgDowntime,
      isRecoveryActive: this.isRecoveryActive
    };
  }

  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') return false;

    execution.status = 'cancelled';
    execution.endTime = new Date().toISOString();
    this.isRecoveryActive = false;

    return true;
  }

  stopTesting(): void {
    if (this.testTimer) {
      clearInterval(this.testTimer);
      this.testTimer = null;
    }
  }

  // Mock data for demonstration
  loadMockData() {
    console.log('Disaster recovery system initialized with mock data');
  }
}

export const disasterRecoveryManager = DisasterRecoveryManager.getInstance();

// Initialize mock data
disasterRecoveryManager.loadMockData();

