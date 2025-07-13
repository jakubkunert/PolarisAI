# PolarisAI Deployment Guide

## 🏠 Self-Hosted Deployment

PolarisAI is designed to be self-hosted, giving you complete control over your AI agents and data.

### **Prerequisites**
- Node.js 18+ or Bun (recommended)
- Docker (recommended)
- PostgreSQL database (optional, for persistence)
- Redis (optional, for caching)

### **Quick Start**

#### **1. Clone and Install**
```bash
git clone https://github.com/jakubkunert/PolarisAI.git
cd PolarisAI
bun install
```

#### **2. Environment Setup**
```bash
# Copy example environment file
cp .env.example .env.local

# Edit your environment variables
nano .env.local
```

#### **3. Environment Variables**
```env
# Basic Configuration
NODE_ENV=production

# Database (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/polarisai

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Security
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Model Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
```

#### **4. Database Setup (Optional)**
```bash
# Run migrations (if using database)
bun run db:migrate

# Seed initial data
bun run db:seed
```

#### **5. Start the Application**
```bash
# Development
bun dev

# Production
bun build
bun start
```

### **Docker Deployment**

#### **Using Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/polarisai
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=polarisai
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

```bash
# Deploy with Docker Compose
docker-compose up -d
```

### **Kubernetes Deployment**

#### **Basic Kubernetes Configuration**
```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: polarisai
spec:
  replicas: 3
  selector:
    matchLabels:
      app: polarisai
  template:
    metadata:
      labels:
        app: polarisai
    spec:
      containers:
      - name: polarisai
        image: polarisai:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: polarisai-secrets
              key: database-url
```

## 🔧 Configuration Reference

### **Environment Variables**
```env
# Application
NODE_ENV=development|production
PORT=3000

# Database (optional)
DATABASE_URL=postgresql://...

# Cache (optional)
REDIS_URL=redis://...

# Security
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# Model Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
OLLAMA_HOST=http://localhost:11434
```

### **Database Schema (Optional)**
```sql
-- Core tables for persistent storage
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  agent_id UUID REFERENCES agents(id),
  messages JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📊 Monitoring & Analytics

### **Built-in Analytics**
```bash
# Access analytics dashboard
# Available at /admin/analytics (if enabled)

# Custom metrics
# Export to Prometheus/Grafana
# Log aggregation with ELK stack
```

## 🔒 Security Considerations

### **Production Security**
- **HTTPS**: Use SSL/TLS certificates (Let's Encrypt recommended)
- **Database Security**: Strong passwords, network isolation
- **API Keys**: Secure storage of model provider keys
- **Regular Updates**: Keep dependencies updated
- **Backup Strategy**: Regular automated backups
- **Access Controls**: Implement authentication if needed

### **Network Security**
```bash
# Firewall configuration
# Only allow necessary ports (80, 443, 22)

# Reverse proxy setup (nginx/caddy)
# SSL termination
# Rate limiting
```

## 🚨 Troubleshooting

### **Common Issues**

#### **Database Connection Issues**
```bash
# Check database URL format
DATABASE_URL=postgresql://user:password@host:port/database

# Test connection
psql $DATABASE_URL
```

#### **Model Provider Issues**
```bash
# Check API keys
echo $OPENAI_API_KEY

# Test connectivity
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models
```

#### **Performance Issues**
```bash
# Check resource usage
docker stats

# Review logs
docker logs polarisai-app

# Monitor database performance
# Check Redis memory usage
```

### **Getting Help**

#### **Community Support**
- **GitHub Issues**: https://github.com/jakubkunert/PolarisAI/issues
- **GitHub Discussions**: https://github.com/jakubkunert/PolarisAI/discussions
- **Documentation**: https://docs.polarisai.com

## 📈 Scaling

### **Horizontal Scaling**
```bash
# Load balancer setup
# Multiple app instances
# Database read replicas
# Redis cluster for caching
# CDN for static assets
```

### **Performance Optimization**
```bash
# Enable Redis caching
# Database query optimization
# Asset optimization
# Image compression
# Bundle splitting
```

## 🔄 Updates

### **Staying Updated**
```bash
# Check for updates
git fetch origin
git log HEAD..origin/main --oneline

# Update application
git pull origin main
bun install
bun build

# Restart services
docker-compose restart
```

### **Backup Before Updates**
```bash
# Backup database
pg_dump $DATABASE_URL > backup.sql

# Backup configuration
cp .env.local .env.backup

# Test in staging first
```

## 📋 Production Checklist

### **Before Going Live**
- [ ] HTTPS certificates configured
- [ ] Database backups automated
- [ ] Environment variables secured
- [ ] Monitoring setup
- [ ] Error tracking configured
- [ ] Log rotation enabled
- [ ] Firewall configured
- [ ] Resource limits set

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Analytics working
- [ ] Backups tested
- [ ] Performance baseline established
- [ ] Update process documented

This guide ensures you can run PolarisAI securely and efficiently in your own environment with complete control over your data and infrastructure. 