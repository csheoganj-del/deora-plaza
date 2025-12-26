# DEORA Plaza - Redundant Backend System

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
```bash
npm install
```

2. Copy environment template:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration

4. Generate configuration files:
```bash
npm run backend:config
```

5. Start the backend system:
```bash
npm run backend:start
```

## 📋 Available Scripts

- `npm run backend:start` - Start the redundant backend system
- `npm run backend:health` - Perform comprehensive health check
- `npm run backend:config` - Generate configuration files
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production

## 🔧 Configuration

### Server Configuration (`config/servers.json`)
- Primary and secondary server settings
- Ports, hosts, weights, priorities

### Load Balancer (`config/loadbalancer.json`)
- Balancing modes: round_robin, weighted, failover
- Health check intervals and timeouts
- Retry settings

### Database (`config/database.json`)
- Primary and secondary database connections
- Sync intervals and failover settings

### Cache (`config/cache.json`)
- Redis connection settings
- Memory fallback configuration

### Logger (`config/logger.json`)
- Log levels and output destinations
- File rotation settings

## 🏥 Health Monitoring

Check system health:
```bash
npm run backend:health
```

Health endpoints:
- `GET /health` - Basic health check
- `GET /status` - Detailed system status
- `GET /metrics` - Performance metrics

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
```bash
docker-compose up -d
```

Scale services:
```bash
docker-compose up -d --scale deora-primary=2
```

## 🔧 Production Deployment

### With Systemd (Linux)
```bash
sudo ./install-service.sh
sudo systemctl start deora-backend
```

### With PM2
```bash
pm2 start ecosystem.config.js
```

### With Docker Swarm
```bash
docker stack deploy -c docker-compose.yml deora
```

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
4. Review logs in `logs/system.log`

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

```typescript
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
```

### Migration from Firebase

Replace your existing Firebase calls:
```typescript
// Before
import { createDocument } from './lib/firebase/firestore';

// After
import { createDocument } from './lib/redundant-backend';
```

## 🚨 Emergency Procedures

### Manual Failover
```bash
# Switch to secondary server
curl -X POST http://localhost:3000/admin/failover

# Switch back to primary
curl -X POST http://localhost:3000/admin/recover
```

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
