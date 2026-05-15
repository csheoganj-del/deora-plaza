"use client";

/**
 * 🔄 Database Sync Dashboard
 * 
 * Real-time monitoring and control of database synchronization
 * between Supabase and Firebase
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Database, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Activity,
  Clock,
  BarChart3,
  Settings,
  Trash2
} from 'lucide-react';
import { getSyncInitializer } from '@/lib/database/sync-initializer';

interface SyncStatus {
  initialized: boolean;
  isRunning: boolean;
  lastSync: Date | null;
  totalRecordsSynced: number;
  errors: any[];
  currentOperation: string | null;
  progress: {
    table: string;
    completed: number;
    total: number;
  } | null;
  statistics: {
    totalRecordsSynced: number;
    errorCount: number;
    lastSync: Date | null;
    isRunning: boolean;
    queueSize: number;
    tablesMonitored: number;
  };
}

export function SyncDashboard() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const syncInitializer = getSyncInitializer();

  // Update status every 5 seconds
  useEffect(() => {
    const updateStatus = () => {
      try {
        const status = syncInitializer.getSyncStatus();
        setSyncStatus(status as SyncStatus);
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to get sync status:', error);
      }
    };

    updateStatus();
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, [syncInitializer]);

  // Listen for sync events
  useEffect(() => {
    const handleSyncEvent = (event: string) => {
      console.log(`Sync event: ${event}`);
      // Refresh status immediately
      setTimeout(() => {
        const status = syncInitializer.getSyncStatus();
        setSyncStatus(status as SyncStatus);
      }, 100);
    };

    syncInitializer.on('sync-started', () => handleSyncEvent('started'));
    syncInitializer.on('sync-stopped', () => handleSyncEvent('stopped'));
    syncInitializer.on('sync-progress', () => handleSyncEvent('progress'));
    syncInitializer.on('sync-error', () => handleSyncEvent('error'));

    return () => {
      syncInitializer.removeAllListeners();
    };
  }, [syncInitializer]);

  const handleStartSync = async () => {
    setIsLoading(true);
    try {
      await syncInitializer.enableSync();
    } catch (error) {
      console.error('Failed to start sync:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopSync = async () => {
    setIsLoading(true);
    try {
      await syncInitializer.disableSync();
    } catch (error) {
      console.error('Failed to stop sync:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceSync = async () => {
    setIsLoading(true);
    try {
      await syncInitializer.forceFullSync();
    } catch (error) {
      console.error('Failed to force sync:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!syncStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading sync status...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = () => {
    if (!syncStatus.initialized) return 'destructive';
    if (syncStatus.isRunning) return 'default';
    return 'secondary';
  };

  const getStatusIcon = () => {
    if (!syncStatus.initialized) return <XCircle className="h-4 w-4" />;
    if (syncStatus.isRunning) return <CheckCircle className="h-4 w-4" />;
    return <Pause className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!syncStatus.initialized) return 'Not Initialized';
    if (syncStatus.isRunning) return 'Running';
    return 'Stopped';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Database Synchronization</h2>
          <p className="text-muted-foreground">
            Real-time sync between Supabase and Firebase
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusColor()} className="flex items-center space-x-1">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </Badge>
          <span className="text-xs text-muted-foreground">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Control Panel</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            {syncStatus.isRunning ? (
              <Button 
                onClick={handleStopSync} 
                disabled={isLoading}
                variant="destructive"
                className="flex items-center space-x-2"
              >
                <Pause className="h-4 w-4" />
                <span>Stop Sync</span>
              </Button>
            ) : (
              <Button 
                onClick={handleStartSync} 
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <Play className="h-4 w-4" />
                <span>Start Sync</span>
              </Button>
            )}
            
            <Button 
              onClick={handleForceSync} 
              disabled={isLoading || !syncStatus.initialized}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Force Full Sync</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Operation */}
      {syncStatus.currentOperation && (
        <Alert>
          <Activity className="h-4 w-4" />
          <AlertTitle>Current Operation</AlertTitle>
          <AlertDescription>{syncStatus.currentOperation}</AlertDescription>
        </Alert>
      )}

      {/* Progress */}
      {syncStatus.progress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Sync Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Table: {syncStatus.progress.table}</span>
                <span>{syncStatus.progress.completed} / {syncStatus.progress.total}</span>
              </div>
              <Progress 
                value={(syncStatus.progress.completed / syncStatus.progress.total) * 100} 
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Synced</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {syncStatus.statistics?.totalRecordsSynced?.toLocaleString() || 0}
                </div>
                <p className="text-xs text-muted-foreground">Records synchronized</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {syncStatus.statistics?.queueSize || 0}
                </div>
                <p className="text-xs text-muted-foreground">Pending operations</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tables Monitored</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {syncStatus.statistics?.tablesMonitored || 0}
                </div>
                <p className="text-xs text-muted-foreground">Real-time subscriptions</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {syncStatus.lastSync 
                    ? new Date(syncStatus.lastSync).toLocaleTimeString()
                    : 'Never'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {syncStatus.lastSync 
                    ? new Date(syncStatus.lastSync).toLocaleDateString()
                    : 'No sync performed'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sync Statistics</CardTitle>
              <CardDescription>Detailed synchronization metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <p className="text-lg">{getStatusText()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Initialized</label>
                    <p className="text-lg">{syncStatus.initialized ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Error Count</label>
                    <p className="text-lg">{syncStatus.statistics?.errorCount || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Success Rate</label>
                    <p className="text-lg">
                      {syncStatus.statistics?.totalRecordsSynced > 0
                        ? (((syncStatus.statistics.totalRecordsSynced - (syncStatus.statistics.errorCount || 0)) / syncStatus.statistics.totalRecordsSynced) * 100).toFixed(1)
                        : 0
                      }%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Sync Errors</span>
                </CardTitle>
                <CardDescription>Recent synchronization errors</CardDescription>
              </div>
              {syncStatus.errors && syncStatus.errors.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear Errors</span>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!syncStatus.errors || syncStatus.errors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No sync errors! Everything is working perfectly.</p>
                </div>
              ) : (
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {syncStatus.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>
                          {error.table} - {error.operation}
                        </AlertTitle>
                        <AlertDescription>
                          <div className="space-y-1">
                            <p>{error.error}</p>
                            <p className="text-xs">
                              {new Date(error.timestamp).toLocaleString()}
                              {error.recordId && ` - Record: ${error.recordId}`}
                              {error.retryCount > 0 && ` - Retries: ${error.retryCount}`}
                            </p>
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}