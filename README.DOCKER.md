# DevHub - Production-Ready Docker Setup

> 🚀 **Fully functional Docker configuration for local development and production deployment**

## ✨ What's Included

### Docker Files
- ✅ **Dockerfile** - Production all-in-one image (backend serves frontend)
- ✅ **Dockerfile.backend** - Standalone backend service
- ✅ **Dockerfile.frontend** - Standalone frontend with nginx
- ✅ **docker-compose.yml** - Development setup (separate frontend/backend)
- ✅ **docker-compose.prod.yml** - Production setup (all-in-one)
- ✅ **.dockerignore** - Optimized build context
- ✅ **.env** - Real environment variables (with your credentials)
- ✅ **docker.bat** / **docker.sh** - Helper scripts for easy management

### Features
- 🔒 **Security**: Non-root user, health checks, minimal base images
- ⚡ **Performance**: Multi-stage builds, layer caching, optimized images
- 🔄 **Persistence**: Named volumes for database and logs
- 🏥 **Health Checks**: Automated health monitoring with retries
- 📦 **Complete**: All integrations (GitHub, Hugging Face, Vercel, Supabase)
- 🎯 **Production Ready**: Proper environment configuration, logging, restart policies

## 🚀 Quick Start

### Option 1: Development Mode (Recommended for active development)
Runs frontend and backend in separate containers.

**Windows:**
```cmd
docker.bat dev
```

**Linux/Mac:**
```bash
chmod +x docker.sh
./docker.sh dev
```

**Access:**
- Frontend: http://localhost:4173
- Backend API: http://localhost:4000
- Health Check: http://localhost:4000/health

### Option 2: Production Mode (Single container)
Backend serves static frontend files.

**Windows:**
```cmd
docker.bat prod
```

**Linux/Mac:**
```bash
./docker.sh prod
```

**Access:**
- Application: http://localhost:4000 (includes frontend + API)
- Health Check: http://localhost:4000/health

## 📋 Prerequisites

- **Docker**: Version 20.10+ ([Download](https://www.docker.com/products/docker-desktop))
- **Docker Compose**: Version 2.0+ (included with Docker Desktop)
- **Credentials**: GitHub token, Hugging Face API key (already in `.env`)

## 🛠️ Available Commands

### Development Workflow

```bash
# Start services
docker.bat dev              # Windows
./docker.sh dev            # Linux/Mac

# View logs
docker.bat logs            # All services
docker.bat logs-backend    # Backend only
docker.bat logs-frontend   # Frontend only

# Restart after code changes
docker.bat rebuild         # Full rebuild
docker.bat restart         # Quick restart

# Stop services
docker.bat stop
```

### Production Deployment

```bash
# Deploy production container
docker.bat prod

# Check health
docker.bat health

# Access backend shell
docker.bat shell-backend

# Backup database
docker.bat db-backup

# Restore database
docker.bat db-restore backup-20260106-143000.db
```

### Maintenance

```bash
# Remove everything (clean slate)
docker.bat clean           # Removes containers, volumes, networks

# Check service status
docker.bat health

# View resource usage
docker stats devhub-backend devhub-frontend
```

## 📁 Project Structure

```
dev-hub/
├── Dockerfile                  # Production all-in-one
├── Dockerfile.backend          # Backend only
├── Dockerfile.frontend         # Frontend only
├── docker-compose.yml          # Dev environment
├── docker-compose.prod.yml     # Prod environment
├── .dockerignore               # Build optimization
├── .env                        # Real credentials
├── .env.docker                 # Template
├── docker.bat                  # Windows helper
├── docker.sh                   # Linux/Mac helper
├── DOCKER.md                   # Full documentation
└── README.DOCKER.md            # This file
```

## 🔧 Configuration

### Environment Variables

The `.env` file is pre-configured with your credentials:

```ini
# API
PORT=4000
API_ADMIN_TOKEN=devhub-local-admin-token

# GitHub (✅ Configured)
GITHUB_TOKEN=ghp_TUAd9HqN...
GITHUB_OWNER=yourgodfather12

# Hugging Face (✅ Configured)
HF_API_KEY=hf_mTqkKgoVbz...

# Vercel (✅ Configured)
VERCEL_TOKEN=arwUKzL5Fv...

# Supabase (✅ Configured)
SUPABASE_ACCESS_TOKEN=sbp_fccb5dc...
```

### Ports

| Service  | Default Port | Configurable |
|----------|-------------|--------------|
| Backend  | 4000        | `PORT`       |
| Frontend | 4173        | `FRONTEND_PORT` |

Change ports in `.env` if needed:
```ini
PORT=4001
FRONTEND_PORT=4174
```

## 🏥 Health Monitoring

### Automated Health Checks

Both services include health checks that run every 30 seconds:

- **Backend**: HTTP GET `/health`
- **Frontend**: nginx availability check

### Check Health Status

```bash
# View health for all services
docker.bat health

# Manual health check
curl http://localhost:4000/health
curl http://localhost:4173/
```

### Health Check Results

```
CONTAINER ID   NAME              STATUS                    HEALTH
abc123def456   devhub-backend    Up 2 minutes (healthy)
def789ghi012   devhub-frontend   Up 2 minutes (healthy)
```

## 💾 Data Persistence

### Volumes

Two named volumes persist data across container restarts:

1. **devhub_db**: SQLite database with all projects, deployments, and settings
2. **devhub_logs**: Application logs

### Database Backup/Restore

```bash
# Create backup
docker.bat db-backup
# Creates: backup-20260106-143000.db

# Restore from backup
docker.bat db-restore backup-20260106-143000.db
```

### Manual Volume Access

```bash
# List volumes
docker volume ls | findstr devhub

# Inspect volume
docker volume inspect devhub_db

# Backup volume (Linux/Mac)
docker run --rm -v devhub_db:/data -v $(pwd):/backup alpine tar czf /backup/db-backup.tar.gz /data
```

## 🔍 Troubleshooting

### Common Issues

#### Port Already in Use

**Problem**: `Error: bind: address already in use`

**Solution**: Change ports in `.env` or stop the conflicting service:
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:4000 | xargs kill
```

#### Build Failures

**Problem**: npm install fails or timeout

**Solution**:
```bash
# Clean Docker cache
docker builder prune -a

# Rebuild from scratch
docker.bat rebuild
```

#### Health Check Failing

**Problem**: Container unhealthy

**Solution**:
```bash
# Check logs
docker.bat logs-backend

# Verify environment
docker exec devhub-backend env | findstr GITHUB

# Test manually
docker exec -it devhub-backend sh
curl http://localhost:4000/health
```

#### Frontend Not Loading

**Problem**: White screen or connection refused

**Solution**:
1. Check backend is healthy: `docker.bat health`
2. Verify CORS: Check `CORS_ALLOWED_ORIGINS` in `.env`
3. Check browser console for API URL
4. Verify `VITE_API_BASE_URL` matches backend URL

### Getting Help

1. **Check logs**: `docker.bat logs`
2. **Verify health**: `docker.bat health`
3. **Check environment**: `docker exec devhub-backend env`
4. **Review documentation**: See `DOCKER.md` for detailed guide

## 🚢 Deployment

### Local Production Test

```bash
# Build and run production container
docker.bat prod

# Access application
start http://localhost:4000
```

### Cloud Deployment

#### Option 1: Docker Hub

```bash
# Tag images
docker tag devhub-app yourusername/devhub:latest

# Push to registry
docker push yourusername/devhub:latest

# Deploy on server
docker pull yourusername/devhub:latest
docker run -d -p 4000:4000 --env-file .env yourusername/devhub:latest
```

#### Option 2: Cloud Run (Google Cloud)

```bash
# Build for Cloud Run
docker build -t gcr.io/YOUR_PROJECT/devhub .

# Push to GCR
docker push gcr.io/YOUR_PROJECT/devhub

# Deploy
gcloud run deploy devhub \
  --image gcr.io/YOUR_PROJECT/devhub \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### Option 3: AWS ECS / Azure Container Instances

See `DOCKER.md` for detailed deployment guides.

## 📊 Monitoring

### Resource Usage

```bash
# Real-time stats
docker stats devhub-backend devhub-frontend

# One-time snapshot
docker stats --no-stream
```

### Logs

```bash
# Follow all logs
docker.bat logs

# Last 100 lines
docker logs --tail 100 devhub-backend

# Filter by time
docker logs --since 1h devhub-backend

# Export logs
docker logs devhub-backend > backend.log 2>&1
```

## 🔐 Security

### Best Practices Implemented

- ✅ **Non-root user**: Containers run as `node` user
- ✅ **Minimal base**: Using `node:20-slim` and `nginx:alpine`
- ✅ **Secrets management**: Credentials in `.env`, not hardcoded
- ✅ **Health checks**: Automatic monitoring and restart
- ✅ **Network isolation**: Services on dedicated bridge network
- ✅ **Updated dependencies**: Regular npm updates

### Production Security Checklist

Before deploying to production:

- [ ] Change `API_ADMIN_TOKEN` to a strong, unique value
- [ ] Rotate GitHub and Hugging Face tokens regularly
- [ ] Use HTTPS (nginx/Caddy reverse proxy)
- [ ] Restrict CORS to your production domain
- [ ] Enable firewall rules
- [ ] Set up backup automation
- [ ] Configure log aggregation (ELK, Splunk, etc.)
- [ ] Enable container scanning (Docker Scout, Trivy)

## 📚 Additional Resources

- **Full Documentation**: See `DOCKER.md`
- **Docker Docs**: https://docs.docker.com
- **Compose Docs**: https://docs.docker.com/compose
- **Best Practices**: https://docs.docker.com/develop/dev-best-practices

## 🎯 Next Steps

1. **Start the app**: Run `docker.bat dev`
2. **Access the dashboard**: Open http://localhost:4173
3. **Check integrations**: Verify GitHub, HF in the UI
4. **Monitor health**: Run `docker.bat health` periodically
5. **Review logs**: Use `docker.bat logs` to watch activity
6. **Deploy to prod**: When ready, use `docker.bat prod`

## 💡 Tips

- **Fast rebuilds**: Use `docker.bat restart` instead of `rebuild` for code changes
- **Debug mode**: Use `docker exec -it devhub-backend sh` to explore the container
- **Clean start**: Use `docker.bat clean` then `docker.bat dev` for a fresh environment
- **Save bandwidth**: Docker caches layers, so subsequent builds are much faster

---

**Need help?** Check `DOCKER.md` for comprehensive guides, or review logs with `docker.bat logs`.
