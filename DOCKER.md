# DevHub Docker Deployment Guide

## Quick Start

### 1. Configure Environment Variables

Copy the template and customize with your credentials:
```bash
cp .env.docker .env
```

Edit `.env` and add your tokens:
- `GITHUB_TOKEN`: Get from https://github.com/settings/tokens
- `HF_API_KEY`: Get from https://huggingface.co/settings/tokens
- Other optional services (Vercel, Supabase)

### 2. Build and Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

### 3. Access the Application

- **Frontend**: http://localhost:4173
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health

## Architecture

### Services

1. **backend** (Port 4000)
   - Fastify API server
   - Prisma ORM with SQLite
   - GitHub, Vercel, Supabase integrations
   - Hugging Face AI features

2. **frontend** (Port 4173)
   - React + Vite SPA
   - Served via nginx
   - Connects to backend API

### Volumes

- `devhub_db`: Persistent SQLite database
- `devhub_logs`: Application logs

### Networks

- `devhub`: Bridge network connecting frontend and backend

## Production Deployment

### Security Checklist

- [ ] Change all default tokens in `.env`
- [ ] Use strong, unique `API_ADMIN_TOKEN`
- [ ] Restrict `CORS_ALLOWED_ORIGINS` to your domain
- [ ] Use HTTPS in production (nginx/Caddy reverse proxy)
- [ ] Keep `GITHUB_TOKEN` and `HF_API_KEY` secret
- [ ] Regularly update Docker images

### Environment Variables

#### Required
- `GITHUB_TOKEN`: For GitHub API access
- `HF_API_KEY`: For Hugging Face AI features
- `API_ADMIN_TOKEN`: Admin authentication

#### Optional
- `VERCEL_TOKEN`, `VERCEL_TEAM_ID`: Vercel deployments
- `SUPABASE_ACCESS_TOKEN`, `SUPABASE_URL`: Supabase integration

### Health Checks

Both services include health checks:
- Backend: `GET /health` (30s interval)
- Frontend: nginx availability check (30s interval)

Frontend depends on backend health before starting.

## Development

### Local Development vs Docker

For active development, use local setup:
```bash
# Terminal 1 - Backend
cd server
npm install
npm run dev

# Terminal 2 - Frontend
npm install
npm run dev
```

Use Docker for:
- Production builds
- Testing deployment
- CI/CD pipelines
- Consistent environments

### Building Individual Services

```bash
# Backend only
docker-compose up -d backend

# Frontend only (requires backend)
docker-compose up -d frontend

# Rebuild single service
docker-compose up -d --build backend
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Database Management

Access the SQLite database:
```bash
# Enter backend container
docker exec -it devhub-backend sh

# Access database
sqlite3 /app/server/data/dev.db

# Backup database
docker cp devhub-backend:/app/server/data/dev.db ./backup.db
```

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 4000
netstat -ano | findstr :4000  # Windows
lsof -i :4000                 # Linux/Mac

# Change port in .env
PORT=4001
FRONTEND_PORT=4174
```

### Backend Health Check Failing

```bash
# Check backend logs
docker-compose logs backend

# Verify environment variables
docker exec devhub-backend env | grep GITHUB

# Test health endpoint
curl http://localhost:4000/health
```

### Frontend Not Connecting to Backend

1. Check `VITE_API_BASE_URL` in `.env`
2. Ensure backend is healthy: `docker-compose ps`
3. Check CORS settings: `CORS_ALLOWED_ORIGINS`

### Prisma Migration Issues

```bash
# Enter backend container
docker exec -it devhub-backend sh

# Run migrations
npx prisma migrate deploy

# Reset database (CAUTION: deletes data)
npx prisma migrate reset --force
```

### Clean Slate

```bash
# Stop and remove all containers, volumes, networks
docker-compose down -v

# Remove images
docker rmi devhub-backend devhub-frontend

# Rebuild from scratch
docker-compose up -d --build
```

## Performance Optimization

### Build Cache

Docker layer caching speeds up rebuilds:
- Dependencies are cached separately
- Only changed layers rebuild
- Use `.dockerignore` to exclude unnecessary files

### Multi-Stage Builds

All Dockerfiles use multi-stage builds:
- Smaller final images (node:20-slim, nginx:alpine)
- Faster deployments
- Reduced attack surface

### Resource Limits

Add to `docker-compose.yml`:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          memory: 256M
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Deploy
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build images
        run: docker-compose build
      - name: Push to registry
        run: |
          docker tag devhub-backend your-registry/devhub-backend
          docker push your-registry/devhub-backend
```

## Monitoring

### Healthchecks

Access health status:
```bash
docker inspect devhub-backend --format='{{.State.Health.Status}}'
docker inspect devhub-frontend --format='{{.State.Health.Status}}'
```

### Resource Usage

```bash
# Live stats
docker stats devhub-backend devhub-frontend

# One-time snapshot
docker stats --no-stream
```

## Support

For issues or questions:
1. Check logs: `docker-compose logs`
2. Verify environment: `docker exec devhub-backend env`
3. Review health: `docker-compose ps`
4. Consult GitHub issues

## License

This Docker setup is part of the DevHub project.
