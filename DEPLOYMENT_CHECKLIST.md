# 🚀 DEORA Plaza - Production Deployment Checklist

## 📋 PRE-DEPLOYMENT CHECKLIST

### 🔒 **CRITICAL SECURITY SETUP** (REQUIRED)

#### 1. Environment Variables Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Generate strong JWT secret (32+ characters): `openssl rand -base64 32`
- [ ] Generate strong NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Set complex ADMIN_DELETION_PASSWORD (12+ characters, mixed case, numbers, symbols)
- [ ] Configure Supabase credentials (URL, ANON_KEY, SERVICE_ROLE_KEY)
- [ ] Verify no default values remain in production

#### 2. Security Validation
```bash
# Run security validation
npm run setup:security

# Validate environment
npm run setup:complete
```

#### 3. Database Setup
```bash
# Apply database migrations
npm run db:migrate

# Or reset and setup fresh (development only)
npm run db:reset
```

---

### 🏗️ **SYSTEM SETUP**

#### 1. Complete System Initialization
```bash
# Run complete setup (creates admin user, default data, validates system)
npm run setup:complete
```

#### 2. Backend System
```bash
# Generate backend configuration
npm run backend:config

# Start backend system
npm run backend:start

# Verify health
npm run backend:health
```

#### 3. Application Build
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Start production server
npm run start
```

---

### 🔍 **VALIDATION STEPS**

#### 1. Security Validation
- [ ] No hardcoded secrets in source code
- [ ] All environment variables set
- [ ] JWT secrets are strong (32+ characters)
- [ ] Deletion password meets complexity requirements
- [ ] Supabase RLS policies active
- [ ] Audit logging functional

#### 2. Functional Testing
- [ ] Admin login works with created credentials
- [ ] All business units accessible
- [ ] Order creation and billing functional
- [ ] Settlement generation works
- [ ] Inventory management operational
- [ ] GST calculations accurate

#### 3. Performance Testing
- [ ] Backend health check passes
- [ ] Load balancer functioning
- [ ] Database connections stable
- [ ] Cache system operational
- [ ] Response times acceptable

---

## 🌐 **PRODUCTION DEPLOYMENT**

### 🔧 **Infrastructure Setup**

#### 1. Server Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB+ recommended  
- **Storage**: 20GB+ SSD
- **Network**: Stable internet connection
- **OS**: Linux (Ubuntu 20.04+ recommended)

#### 2. Dependencies
```bash
# Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 for process management
npm install -g pm2

# Redis (optional, has memory fallback)
sudo apt install redis-server
```

#### 3. SSL Certificate
```bash
# Using Certbot for Let's Encrypt
sudo apt install certbot
sudo certbot --nginx -d yourdomain.com
```

### 🚀 **Application Deployment**

#### 1. Clone and Setup
```bash
# Clone repository
git clone <your-repo-url>
cd deora-plaza

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with production values

# Run complete setup
npm run setup:complete
```

#### 2. Build and Start
```bash
# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. Nginx Configuration
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔍 **POST-DEPLOYMENT VALIDATION**

### 1. **System Health Checks**
```bash
# Check application status
pm2 status

# Check backend health
curl https://yourdomain.com/api/health

# Check database connectivity
npm run backend:health

# Monitor logs
pm2 logs
```

### 2. **Security Validation**
- [ ] HTTPS working correctly
- [ ] Security headers present
- [ ] No sensitive data in logs
- [ ] Admin access restricted
- [ ] Audit logging active

### 3. **Functional Testing**
- [ ] Login system working
- [ ] All business units accessible
- [ ] Order processing functional
- [ ] Payment system operational
- [ ] Reports generating correctly

---

## 📊 **MONITORING SETUP**

### 1. **Application Monitoring**
```bash
# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# System monitoring
sudo apt install htop iotop
```

### 2. **Database Monitoring**
- [ ] Supabase dashboard monitoring enabled
- [ ] Connection pool monitoring
- [ ] Query performance tracking
- [ ] Backup verification

### 3. **Security Monitoring**
- [ ] Failed login attempt alerts
- [ ] Unauthorized access monitoring
- [ ] Audit log analysis
- [ ] Security event notifications

---

## 🔄 **MAINTENANCE PROCEDURES**

### Daily Tasks
- [ ] Check system health status
- [ ] Review error logs
- [ ] Monitor resource usage
- [ ] Verify backup completion

### Weekly Tasks
- [ ] Review audit logs
- [ ] Check security alerts
- [ ] Update system packages
- [ ] Performance analysis

### Monthly Tasks
- [ ] Security audit review
- [ ] Database optimization
- [ ] Backup restoration test
- [ ] User access review

---

## 🆘 **TROUBLESHOOTING**

### Common Issues

#### 1. **Environment Variable Errors**
```bash
# Check environment variables
npm run setup:security

# Validate configuration
node -e "console.log(process.env.JWT_SECRET ? 'JWT_SECRET set' : 'JWT_SECRET missing')"
```

#### 2. **Database Connection Issues**
```bash
# Test Supabase connection
npm run backend:health

# Check database status in Supabase dashboard
```

#### 3. **Backend Server Issues**
```bash
# Check server status
pm2 status

# Restart backend
pm2 restart backend

# Check logs
pm2 logs backend
```

#### 4. **Performance Issues**
```bash
# Check resource usage
htop

# Monitor database performance
# Check Supabase dashboard

# Analyze slow queries
npm run audit:logs
```

---

## 📞 **SUPPORT CONTACTS**

### Technical Support
- **System Administrator**: [Your contact]
- **Database Administrator**: [Your contact]
- **Security Officer**: [Your contact]

### Emergency Procedures
1. **System Down**: Restart PM2 processes
2. **Database Issues**: Check Supabase status
3. **Security Incident**: Follow incident response plan
4. **Performance Issues**: Scale resources or restart services

---

## ✅ **DEPLOYMENT COMPLETION**

### Final Checklist
- [ ] All security measures implemented
- [ ] System fully functional
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Staff trained
- [ ] Emergency procedures documented

### Go-Live Approval
- [ ] Technical validation complete
- [ ] Security audit passed
- [ ] Performance testing successful
- [ ] User acceptance testing complete
- [ ] Business stakeholder approval

---

## 🎉 **CONGRATULATIONS!**

Your DEORA Plaza system is now successfully deployed and ready for production use!

**Next Steps:**
1. Monitor system performance for the first 48 hours
2. Gather user feedback and address any issues
3. Schedule regular maintenance windows
4. Plan for future enhancements and scaling

**Remember:**
- Change default passwords immediately
- Keep system updated with security patches
- Monitor audit logs regularly
- Maintain regular backups
- Follow security best practices

**Support:** Refer to the comprehensive documentation in the repository for ongoing maintenance and troubleshooting.