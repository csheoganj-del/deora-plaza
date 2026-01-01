#!/usr/bin/env node

// Redundant Backend System Startup Script
// This script starts the entire redundant backend system

import { createRedundantBackendSystem } from './index';
import { ConfigManager } from './core/config';
import { initializeLogger } from './logger';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function startBackendSystem() {
  console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃          🚀 DEORA PLAZA BACKEND STARTUP          ┃
┃           REDUNDANT ARCHITECTURE v1.0            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `);

  try {
    console.log('🔧 Initializing configuration manager...');
    const configManager = ConfigManager.getInstance();

    // Validate configuration
    const validation = configManager.validateConfig();
    if (!validation.isValid) {
      console.error('❌ Configuration validation failed:');
      validation.errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }

    console.log('✅ Configuration validated successfully');

    // Generate config files if they don't exist
    console.log('📝 Generating configuration files...');
    configManager.generateAllConfigs();

    // Initialize and start the backend system
    console.log('🚀 Starting redundant backend system...');
    const backendSystem = createRedundantBackendSystem();
    await backendSystem.start();

    // Setup graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n⚠️  Received ${signal}. Shutting down gracefully...`);

      try {
        await backendSystem.stop();
        console.log('✅ Backend system stopped successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

    // Log startup success
    const config = configManager.getConfig();
    console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃              🎉 SYSTEM ONLINE!                   ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃                                                  ┃
┃  Primary Server:   http://localhost:${config.servers.primary.port}          ┃
┃  Secondary Server: http://localhost:${config.servers.secondary.port}          ┃
┃  Load Balancer:    ${config.loadBalancer.mode.toUpperCase()}                   ┃
┃  Health Checks:    Every ${config.loadBalancer.health_check_interval / 1000}s              ┃
┃                                                  ┃
┃  Features Active:                                ┃
┃  ✅ Dual server redundancy                      ┃
┃  ✅ Automatic failover                          ┃
┃  ✅ Database replication                        ┃
┃  ✅ Redis + Memory cache                        ┃
┃  ✅ Offline queue system                        ┃
┃  ✅ Circuit breaker protection                  ┃
┃  ✅ Comprehensive logging                       ┃
┃                                                  ┃
┃  Press Ctrl+C to stop                           ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
    `);

    // Start health monitoring
    setInterval(async () => {
      try {
        const health = await backendSystem.healthCheck();
        const emoji = health.overall === 'healthy' ? '💚' :
                     health.overall === 'degraded' ? '💛' : '❤️';
        console.log(`${emoji} System Health: ${health.overall.toUpperCase()}`);
      } catch (error) {
        console.error('⚠️  Health check failed:', error);
      }
    }, 30000); // Every 30 seconds

    // Keep process alive
    process.stdin.resume();

  } catch (error) {
    console.error('❌ Failed to start backend system:', error);

    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }

    process.exit(1);
  }
}

// Display environment template if no config found
function displayEnvTemplate() {
  const configManager = ConfigManager.getInstance();
  console.log('\n📋 Environment Variables Template:');
  console.log('Copy this to your .env file:');
  console.log('\n' + configManager.getEnvironmentTemplate());
}

// Check if help is requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
DEORA Plaza Redundant Backend System

Usage:
  npm run backend:start        Start the backend system
  npm run backend:start -- -h  Show this help

Environment Variables:
  Create a .env file with the required configuration.
  Run with --env-template to see all available options.

Examples:
  npm run backend:start
  npm run backend:start -- --env-template
  `);
  process.exit(0);
}

// Show environment template if requested
if (process.argv.includes('--env-template')) {
  displayEnvTemplate();
  process.exit(0);
}

// Start the system
startBackendSystem().catch((error) => {
  console.error('💥 Fatal error during startup:', error);
  process.exit(1);
});

