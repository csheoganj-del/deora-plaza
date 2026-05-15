#!/usr/bin/env node

// Configuration Generation Script for Redundant Backend System
// This script generates all necessary configuration files with proper defaults

import { ConfigManager } from './core/config';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function generateConfiguration() {
  console.log(`
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃         📝 CONFIGURATION GENERATOR               ┃
┃        Redundant Backend System Setup            ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
  `);

  try {
    console.log('🔧 Initializing configuration manager...');
    const configManager = ConfigManager.getInstance();

    // Ensure config directory exists
    const configDir = path.join(process.cwd(), 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log('📁 Created config directory');
    }

    // Ensure logs directory exists
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
      console.log('📁 Created logs directory');
    }

    console.log('📄 Generating configuration files...\n');

    // Generate all configuration files
    configManager.generateAllConfigs();

    // Generate additional configuration files
    await generateDockerConfig();
    await generateNginxConfig();
    await generateSystemdService();
    await generateEnvironmentTemplate();
    await generateReadme();

    console.log('\n✅ Configuration generation completed!\n');

    // Display summary
    displayConfigurationSummary(configManager);

    // Validate generated configuration
    console.log('🔍 Validating generated configuration...');
    const validation = configManager.validateConfig();

    if (validation.isValid) {
      console.log('✅ Configuration validation passed!\n');
      displayNextSteps();
    } else {
      console.log('❌ Configuration validation failed:');
      validation.errors.forEach(error => {
        console.log(`   - ${error}`);
      });
      console.log('\n🔧 Please review and fix the configuration issues.');
    }

  } catch (error) {
    console.error('❌ Configuration generation failed:', error);

    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n')
      });
    }

    process.exit(1);
  }
}

async function generateDockerConfig(): Promise<void> {
  const dockerCompose = `version: '3.8'

services:
  # Primary Server
  deora-primary:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - SERVER_ID=A
      - SERVER_PORT=3000
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Secondary Server
  deora-secondary:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - SERVER_ID=B
      - SERVER_PORT=3001
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - redis
    volumes:
      - ./logs:/app/logs
      - ./config:/app/config
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Load Balancer (Nginx)
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./logs:/var/log/nginx
    depends_on:
      - deora-primary
      - deora-secondary
    restart: unless-stopped

volumes:
  redis_data:
`;

  const dockerfile = `FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S deora -u 1001

# Set ownership
RUN chown -R deora:nodejs /app
USER deora

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "run", "backend:start"]
`;

  fs.writeFileSync(path.join(process.cwd(), 'docker-compose.yml'), dockerCompose);
  fs.writeFileSync(path.join(process.cwd(), 'Dockerfile'), dockerfile);
  console.log('🐳 Generated Docker configuration');
}

async function generateNginxConfig(): Promise<void> {
  const nginxConfig = `events {
    worker_connections 1024;
}

http {
    upstream deora_backend {
        least_conn;
        server deora-primary:3000 max_fails=3 fail_timeout=30s;
        server deora-secondary:3001 max_fails=3 fail_timeout=30s backup;
    }

    server {
        listen 80;
        server_name localhost;

        # Health check endpoint
        location /health {
            access_log off;
            proxy_pass http://deora_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_connect_timeout 5s;
            proxy_send_timeout 5s;
            proxy_read_timeout 5s;
        }

        # Main application
        location / {
            proxy_pass http://deora_backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            # Buffer settings
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
            proxy_busy_buffers_size 8k;
        }

        # Static files (if any)
        location /static/ {
            alias /app/public/;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Error pages
        error_page 502 503 504 /maintenance.html;
        location = /maintenance.html {
            root /etc/nginx/html;
            internal;
        }
    }
}
`;

  fs.writeFileSync(path.join(process.cwd(), 'nginx.conf'), nginxConfig);
  console.log('🌐 Generated Nginx configuration');
}

async function generateSystemdService(): Promise<void> {
  const systemdService = `[Unit]
Description=DEORA Plaza Redundant Backend System
Documentation=https://github.com/your-org/deora-plaza
After=network.target
Wants=network.target

[Service]
Type=simple
User=deora
Group=deora
WorkingDirectory=/opt/deora-plaza
ExecStart=/usr/bin/npm run backend:start
ExecReload=/bin/kill -HUP $MAINPID
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=deora-backend

# Environment
Environment=NODE_ENV=production
Environment=PORT=3000

# Security
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=strict
ReadWritePaths=/opt/deora-plaza/logs
ReadWritePaths=/opt/deora-plaza/config

# Resource limits
LimitNOFILE=65536
LimitNPROC=4096

[Install]
WantedBy=multi-user.target
`;

  const installScript = `#!/bin/bash

# DEORA Plaza Systemd Service Installation Script

set -e

echo "Installing DEORA Plaza Backend Service..."

# Create user and group
if ! id "deora" &>/dev/null; then
    sudo useradd -r -s /bin/false deora
    echo "Created deora user"
fi

# Create directories
sudo mkdir -p /opt/deora-plaza
sudo mkdir -p /opt/deora-plaza/logs
sudo mkdir -p /opt/deora-plaza/config

# Copy service file
sudo cp deora-backend.service /etc/systemd/system/

# Set permissions
sudo chown -R deora:deora /opt/deora-plaza

# Reload systemd and enable service
sudo systemctl daemon-reload
sudo systemctl enable deora-backend

echo "Service installed successfully!"
echo "Commands:"
echo "  sudo systemctl start deora-backend    - Start the service"
echo "  sudo systemctl stop deora-backend     - Stop the service"
echo "  sudo systemctl status deora-backend   - Check status"
echo "  sudo journalctl -u deora-backend -f   - View logs"
`;

  fs.writeFileSync(path.join(process.cwd(), 'deora-backend.service'), systemdService);
  fs.writeFileSync(path.join(process.cwd(), 'install-service.sh'), installScript);
  fs.chmodSync(path.join(process.cwd(), 'install-service.sh'), 0o755);
  console.log('🔧 Generated Systemd service configuration');
}

async function generateEnvironmentTemplate(): Promise<void> {
  const configManager = ConfigManager.getInstance();
  const envTemplate = configManager.getEnvironmentTemplate();

  const envExample = `# DEORA Plaza Backend Environment Configuration
# Copy this file to .env and update the values

${envTemplate}

# Firebase Configuration (replace with your actual values)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_SDK_PATH=./path/to/service-account-key.json

# Security
JWT_SECRET=your_jwt_secret_key_here
SESSION_SECRET=your_session_secret_here

# External Services
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
NEW_RELIC_LICENSE_KEY=your_new_relic_key
`;

  fs.writeFileSync(path.join(process.cwd(), '.env.example'), envExample);
  console.log('📋 Generated environment template (.env.example)');
}

async function generateReadme(): Promise<void> {
  const readme = `# DEORA Plaza - Redundant Backend System

## 🏗️ Architecture Overview

This system implements a fully redundant, scalable backend architecture with:

- **Two-Server Architecture**: Primary (Server A) + Secondary (Server B)
- **Automatic Failover**: Seamless switching between servers
- **Load Balancer**: Multiple modes (round-robin, weighted, failover)
- **Redundant Database**: Primary + Secondary with auto-sync
- **Cache Layer**: Redis + Memory fallback
- **Queue System**: Offline operation support
- **Comprehensive Logging**: Global logger with multiple outputs
- **Health Monitoring**: Continuous health checks and alerts

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Redis (optional, has memory fallback)
- Firebase project setup

### Installation

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Copy environment template:
\`\`\`bash
cp .env.example .env
\`\`\`

3. Update \`.env\` with your configuration

4. Generate configuration files:
\`\`\`bash
npm run backend:config
\`\`\`

5. Start the backend system:
\`\`\`bash
npm run backend:start
\`\`\`

## 📋 Available Scripts

- \`npm run backend:start\` - Start the redundant backend system
- \`npm run backend:health\` - Perform comprehensive health check
- \`npm run backend:config\` - Generate configuration files
- \`npm run dev\` - Start Next.js development server
- \`npm run build\` - Build for production

## 🔧 Configuration

### Server Configuration (\`config/servers.json\`)
- Primary and secondary server settings
- Ports, hosts, weights, priorities

### Load Balancer (\`config/loadbalancer.json\`)
- Balancing modes: round_robin, weighted, failover
- Health check intervals and timeouts
- Retry settings

### Database (\`config/database.json\`)
- Primary and secondary database connections
- Sync intervals and failover settings

### Cache (\`config/cache.json\`)
- Redis connection settings
- Memory fallback configuration

### Logger (\`config/logger.json\`)
- Log levels and output destinations
- File rotation settings

## 🏥 Health Monitoring

Check system health:
\`\`\`bash
npm run backend:health
\`\`\`

Health endpoints:
- \`GET /health\` - Basic health check
- \`GET /status\` - Detailed system status
- \`GET /metrics\` - Performance metrics

## 📊 Load Balancer Modes

### Weighted Mode (Default)
- 70% traffic to primary server
- 30% traffic to secondary server
- Configurable weights

### Round Robin Mode
- Alternates between servers
- Equal distribution

### Failover Mode
- Uses primary server only
- Switches to secondary if primary fails

## 🔄 Failover Behavior

1. **Server Failover**:
   - Health checks every 5 seconds
   - Automatic switch on failure
   - Automatic recovery when healthy

2. **Database Failover**:
   - Primary → Secondary on failure
   - Automatic sync when primary recovers
   - Write queue during outages

3. **Cache Failover**:
   - Redis → Memory on connection loss
   - Automatic Redis reconnection
   - Transparent fallback

## 📥 Offline Queue System

- Queues operations when offline
- Automatic processing when online
- Persistent storage option
- Priority-based processing
- Configurable retry logic

## 🐳 Docker Deployment

Run with Docker:
\`\`\`bash
docker-compose up -d
\`\`\`

Scale services:
\`\`\`bash
docker-compose up -d --scale deora-primary=2
\`\`\`

## 🔧 Production Deployment

### With Systemd (Linux)
\`\`\`bash
sudo ./install-service.sh
sudo systemctl start deora-backend
\`\`\`

### With PM2
\`\`\`bash
pm2 start ecosystem.config.js
\`\`\`

### With Docker Swarm
\`\`\`bash
docker stack deploy -c docker-compose.yml deora
\`\`\`

## 📈 Monitoring & Alerts

### Built-in Monitoring
- Health check endpoints
- Performance metrics
- Error tracking
- Uptime monitoring

### External Monitoring
- Supports Sentry integration
- New Relic compatibility
- Custom webhook alerts

## 🔍 Troubleshooting

### Server Won't Start
1. Check port availability
2. Verify environment variables
3. Check Firebase configuration
4. Review logs in \`logs/system.log\`

### Database Connection Issues
1. Verify Firebase credentials
2. Check network connectivity
3. Review database configuration
4. Check service account permissions

### Cache Issues
1. Check Redis server status
2. Verify Redis connection settings
3. Memory fallback should work automatically

### Load Balancer Issues
1. Check server health endpoints
2. Verify server configurations
3. Review load balancer logs

## 📝 API Integration

### Using the Enhanced API

\`\`\`typescript
import {
  createDocumentRedundant,
  getDocumentRedundant,
  updateDocumentRedundant
} from './lib/redundant-backend';

// Create with redundancy
const result = await createDocumentRedundant('orders', orderData);

// Get with caching
const order = await getDocumentRedundant('orders', orderId);

// Update with cache invalidation
await updateDocumentRedundant('orders', orderId, updates);
\`\`\`

### Migration from Firebase

Replace your existing Firebase calls:
\`\`\`typescript
// Before
import { createDocument } from './lib/firebase/firestore';

// After
import { createDocument } from './lib/redundant-backend';
\`\`\`

## 🚨 Emergency Procedures

### Manual Failover
\`\`\`bash
# Switch to secondary server
curl -X POST http://localhost:3000/admin/failover

# Switch back to primary
curl -X POST http://localhost:3000/admin/recover
\`\`\`

### Emergency Mode
If the redundant system fails, emergency mode provides direct Firebase access.

## 📊 Performance Tuning

### Server Optimization
- Adjust worker processes
- Configure memory limits
- Optimize connection pools

### Database Optimization
- Index optimization
- Query performance
- Connection pooling

### Cache Optimization
- TTL tuning
- Memory allocation
- Eviction policies

## 📚 Additional Resources

- [Architecture Documentation](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting Guide](./docs/troubleshooting.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- Create an issue for bug reports
- Join our Discord for community support
- Contact support@deora-plaza.com for enterprise support

---

**DEORA Plaza Redundant Backend System v1.0**
Built with ❤️ for zero-downtime operations
`;

  fs.writeFileSync(path.join(process.cwd(), 'BACKEND_README.md'), readme);
  console.log('📚 Generated comprehensive README');
}

function displayConfigurationSummary(configManager: ConfigManager): void {
  const config = configManager.getConfig();

  console.log('📋 Configuration Summary:');
  console.log('┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓');
  console.log('┃                   SERVERS                        ┃');
  console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
  console.log(`┃ Primary:   ${config.servers.primary.host}:${config.servers.primary.port} (Weight: ${config.servers.primary.weight}%)    ┃`);
  console.log(`┃ Secondary: ${config.servers.secondary.host}:${config.servers.secondary.port} (Weight: ${config.servers.secondary.weight}%)    ┃`);
  console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
  console.log('┃                LOAD BALANCER                     ┃');
  console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
  console.log(`┃ Mode: ${config.loadBalancer.mode.toUpperCase().padEnd(15)}                      ┃`);
  console.log(`┃ Health Check: Every ${(config.loadBalancer.health_check_interval / 1000)}s                    ┃`);
  console.log(`┃ Timeout: ${config.loadBalancer.timeout / 1000}s                               ┃`);
  console.log(`┃ Max Retries: ${config.loadBalancer.max_retries}                              ┃`);
  console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
  console.log('┃                    CACHE                         ┃');
  console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
  console.log(`┃ Redis: ${config.cache.redis.host}:${config.cache.redis.port}                      ┃`);
  console.log(`┃ Fallback: ${config.cache.fallback.type} (${config.cache.fallback.maxSize} items)        ┃`);
  console.log(`┃ TTL: ${config.cache.fallback.ttl}s                                ┃`);
  console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
  console.log('┃                   DATABASE                       ┃');
  console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
  console.log(`┃ Type: Firebase (Dual Redundant)                 ┃`);
  console.log(`┃ Auto Failover: ${config.database.auto_failover ? 'Enabled' : 'Disabled'}                   ┃`);
  console.log(`┃ Sync Interval: ${config.database.sync_interval / 1000}s                         ┃`);
  console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
  console.log('┃                    LOGGER                        ┃');
  console.log('┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫');
  console.log(`┃ Level: ${config.logger.level.toUpperCase()}                                  ┃`);
  console.log(`┃ Outputs: ${config.logger.outputs.join(', ')}                      ┃`);
  console.log(`┃ File: ${config.logger.logFile}                 ┃`);
  console.log('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛');
}

function displayNextSteps(): void {
  console.log('🎯 Next Steps:');
  console.log('');
  console.log('1. 📝 Update .env file with your configuration:');
  console.log('   cp .env.example .env');
  console.log('   # Edit .env with your Firebase, Redis, etc. settings');
  console.log('');
  console.log('2. 🚀 Start the backend system:');
  console.log('   npm run backend:start');
  console.log('');
  console.log('3. 🏥 Check system health:');
  console.log('   npm run backend:health');
  console.log('');
  console.log('4. 🐳 (Optional) Run with Docker:');
  console.log('   docker-compose up -d');
  console.log('');
  console.log('5. 📊 Monitor the system:');
  console.log('   - Primary Server: http://localhost:3000/health');
  console.log('   - Secondary Server: http://localhost:3001/health');
  console.log('   - System Status: http://localhost:3000/status');
  console.log('');
  console.log('📚 For detailed documentation, see BACKEND_README.md');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
DEORA Plaza Configuration Generator

Usage:
  npm run backend:config        Generate all configuration files
  npm run backend:config -- -h  Show this help

Generated Files:
  config/servers.json          - Server configuration
  config/loadbalancer.json     - Load balancer settings
  config/database.json         - Database configuration
  config/cache.json            - Cache settings
  config/logger.json           - Logging configuration
  docker-compose.yml           - Docker deployment
  nginx.conf                   - Nginx load balancer
  deora-backend.service        - Systemd service
  .env.example                 - Environment template
  BACKEND_README.md            - Comprehensive documentation

Examples:
  npm run backend:config
  npm run backend:config -- --force  # Overwrite existing files
  `);
  process.exit(0);
}

// Run configuration generation
generateConfiguration().catch((error) => {
  console.error('💥 Fatal error during configuration generation:', error);
  process.exit(1);
});

