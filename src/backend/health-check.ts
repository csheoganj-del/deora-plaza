#!/usr/bin/env node

// Health Check Script for Redundant Backend System
// This script performs comprehensive health checks on all system components

import { getBackendSystem, createRedundantBackendSystem } from './index';
import { ConfigManager } from './core/config';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function performHealthCheck() {
  console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃            🏥 SYSTEM HEALTH CHECK               ┃
┃          Redundant Backend Diagnostics          ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `);

  try {
    let backendSystem;

    try {
      // Try to get existing backend system
      backendSystem = getBackendSystem();
    } catch (error) {
      console.log('⚠️  Backend system not running, performing configuration check only...');
      await performConfigurationCheck();
      return;
    }

    console.log('🔍 Performing comprehensive health check...\n');

    // 1. Overall System Health
    console.log('📊 Overall System Health:');
    const health = await backendSystem.healthCheck();

    const healthEmoji = health.overall === 'healthy' ? '💚' :
                       health.overall === 'degraded' ? '💛' : '❤️';

    console.log(`   Status: ${healthEmoji} ${health.overall.toUpperCase()}`);
    console.log(`   Checked: ${health.timestamp.toISOString()}\n`);

    // 2. Server Health
    console.log('🖥️  Server Health:');
    console.log(`   Primary Server:   ${health.components.primaryServer ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`   Secondary Server: ${health.components.secondaryServer ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);

    // 3. Load Balancer Health
    console.log('\n⚖️  Load Balancer Health:');
    const lbHealth = health.components.loadBalancer;
    console.log(`   Overall: ${lbHealth.overall === 'healthy' ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`   Healthy Servers: ${lbHealth.statistics?.healthyServers || 0}/${lbHealth.statistics?.totalServers || 0}`);
    console.log(`   Mode: ${lbHealth.statistics?.mode?.toUpperCase() || 'UNKNOWN'}`);

    // 4. Database Health
    console.log('\n🗄️  Database Health:');
    const dbHealth = health.components.database;
    console.log(`   Primary DB:   ${dbHealth.primary ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`   Secondary DB: ${dbHealth.secondary ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`   Active DB:    ${dbHealth.active?.toUpperCase() || 'UNKNOWN'}`);
    if (dbHealth.syncStatus) {
      console.log(`   Sync Status:  ${dbHealth.syncStatus.isInSync ? '✅ IN SYNC' : '⚠️  OUT OF SYNC'}`);
      console.log(`   Pending Ops:  ${dbHealth.syncStatus.pendingOperations || 0}`);
    }

    // 5. Cache Health
    console.log('\n📦 Cache Health:');
    const cacheHealth = health.components.cache;
    console.log(`   Redis:        ${cacheHealth.redis ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
    console.log(`   Memory Cache: ${cacheHealth.memory ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log(`   Active Cache: ${cacheHealth.active?.toUpperCase() || 'UNKNOWN'}`);

    // 6. Queue Health
    console.log('\n📥 Queue Health:');
    const queueHealth = health.components.queue;
    console.log(`   Queue Status: ${queueHealth.isHealthy ? '✅ HEALTHY' : '❌ UNHEALTHY'}`);
    console.log(`   Queue Size:   ${queueHealth.status?.size || 0} items`);
    console.log(`   Processing:   ${queueHealth.status?.processing ? '✅ ACTIVE' : '❌ INACTIVE'}`);
    console.log(`   Network:      ${queueHealth.networkOnline ? '✅ ONLINE' : '❌ OFFLINE'}`);

    // 7. System Statistics
    console.log('\n📈 System Statistics:');
    const status = backendSystem.getSystemStatus();
    console.log(`   Uptime:           ${formatUptime(status.uptime)}`);
    console.log(`   Total Requests:   ${status.totalRequests.toLocaleString()}`);
    console.log(`   Total Errors:     ${status.totalErrors.toLocaleString()}`);
    console.log(`   Error Rate:       ${status.totalRequests > 0 ? ((status.totalErrors / status.totalRequests) * 100).toFixed(2) : 0}%`);
    console.log(`   Avg Response:     ${status.avgResponseTime.toFixed(0)}ms`);
    console.log(`   Active Server:    Server ${status.activeServer}`);

    // 8. Detailed Component Stats
    if (status.components.loadBalancer) {
      console.log('\n⚖️  Load Balancer Statistics:');
      const lbStats = status.components.loadBalancer;
      console.log(`   Total Requests:   ${lbStats.totalRequests?.toLocaleString() || 0}`);
      console.log(`   Total Errors:     ${lbStats.totalErrors?.toLocaleString() || 0}`);
      console.log(`   Avg Response:     ${lbStats.avgResponseTime?.toFixed(0) || 0}ms`);
    }

    // 9. Performance Test
    console.log('\n🚀 Performance Test:');
    await performPerformanceTest(backendSystem);

    // 10. Final Summary
    console.log('\n' + '='.repeat(50));

    if (health.overall === 'healthy') {
      console.log('🎉 SYSTEM STATUS: ALL SYSTEMS OPERATIONAL');
      console.log('✅ Redundant backend is running optimally');
      process.exit(0);
    } else if (health.overall === 'degraded') {
      console.log('⚠️  SYSTEM STATUS: DEGRADED PERFORMANCE');
      console.log('🔧 Some components need attention but system is functional');
      process.exit(1);
    } else {
      console.log('❌ SYSTEM STATUS: CRITICAL ISSUES DETECTED');
      console.log('🚨 Immediate attention required');
      process.exit(2);
    }

  } catch (error) {
    console.error('💥 Health check failed:', error);

    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
    }

    console.log('\n🔧 Troubleshooting Steps:');
    console.log('1. Check if backend servers are running');
    console.log('2. Verify database connections');
    console.log('3. Check Redis server status');
    console.log('4. Review configuration files');
    console.log('5. Check system logs');

    process.exit(3);
  }
}

async function performConfigurationCheck() {
  console.log('🔧 Configuration Validation:');

  try {
    const configManager = ConfigManager.getInstance();
    const validation = configManager.validateConfig();

    if (validation.isValid) {
      console.log('✅ Configuration is valid');

      const config = configManager.getConfig();
      console.log('\n📋 Configuration Summary:');
      console.log(`   Primary Server:   ${config.servers.primary.host}:${config.servers.primary.port}`);
      console.log(`   Secondary Server: ${config.servers.secondary.host}:${config.servers.secondary.port}`);
      console.log(`   Load Balancer:    ${config.loadBalancer.mode}`);
      console.log(`   Health Checks:    Every ${config.loadBalancer.health_check_interval}ms`);
      console.log(`   Max Retries:      ${config.loadBalancer.max_retries}`);
      console.log(`   Redis Host:       ${config.cache.redis.host}:${config.cache.redis.port}`);
      console.log(`   Log Level:        ${config.logger.level}`);

    } else {
      console.log('❌ Configuration validation failed:');
      validation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
    }
  } catch (error) {
    console.error('💥 Configuration check failed:', error);
  }
}

async function performPerformanceTest(backendSystem: any) {
  try {
    const testStart = Date.now();

    // Test cache performance
    console.log('   Testing cache performance...');
    const cacheTestKey = `health_check_${Date.now()}`;
    const cacheTestValue = { test: true, timestamp: new Date() };

    await backendSystem.setCachedValue(cacheTestKey, cacheTestValue, 30);
    const cachedResult = await backendSystem.getCachedValue(cacheTestKey);

    const cacheWorking = cachedResult && cachedResult.test === true;
    console.log(`   Cache Test:       ${cacheWorking ? '✅ PASSED' : '❌ FAILED'}`);

    // Test queue performance
    console.log('   Testing queue performance...');
    const queueTestResult = await backendSystem.queueOperation('health_check_test', {
      test: true,
      timestamp: Date.now()
    }, 1);

    console.log(`   Queue Test:       ${queueTestResult ? '✅ PASSED' : '❌ FAILED'}`);

    const testDuration = Date.now() - testStart;
    console.log(`   Test Duration:    ${testDuration}ms`);

  } catch (error) {
    console.log('   Performance Test: ❌ FAILED');
    console.log(`   Error: ${(error as Error).message}`);
  }
}

function formatUptime(uptimeMs: number): string {
  const seconds = Math.floor(uptimeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
DEORA Plaza Backend Health Check

Usage:
  npm run backend:health        Run comprehensive health check
  npm run backend:health -- -h  Show this help

Health Check Levels:
  Exit Code 0: All systems healthy
  Exit Code 1: System degraded but functional
  Exit Code 2: Critical issues detected
  Exit Code 3: Health check failed

Examples:
  npm run backend:health
  npm run backend:health -- --verbose
  `);
  process.exit(0);
}

// Run health check
performHealthCheck().catch((error) => {
  console.error('💥 Fatal error during health check:', error);
  process.exit(3);
});

