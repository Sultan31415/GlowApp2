# 🐳 GlowApp Docker Setup

This document explains how to run GlowApp with Docker Compose, including the new Aurora background and advanced landing page features.

## Prerequisites

- Docker Desktop installed
- Docker Compose v2+ installed

## Architecture

The application consists of three services:

- **Frontend** (React + Vite + Aurora Background): Port 4173
- **Backend** (FastAPI + Python): Port 8000  
- **Database** (PostgreSQL): Port 5433

## Quick Start

### Using Docker Management Script (Recommended)

```bash
# Start all services
./docker-scripts.sh start

# Stop all services
./docker-scripts.sh stop

# Rebuild and restart (after code changes)
./docker-scripts.sh rebuild

# View logs
./docker-scripts.sh logs

# Check status
./docker-scripts.sh status
```

### Manual Docker Compose Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Build from scratch
docker compose build --no-cache

# View logs
docker compose logs -f

# Check status
docker compose ps
```

## Access Points

Once containers are running:

- **🌐 Frontend with Aurora Background**: http://localhost:4173
- **🔧 Backend API Documentation**: http://localhost:8000/docs
- **🗄️ Database**: localhost:5433 (user: glowuser, password: glowpassword, db: glowdb)

## Features Included

### ✨ Aurora Background
- Beautiful animated gradient background
- Smooth 60-second animation cycle
- Responsive design optimizations
- CSS custom properties integration

### 🎨 Advanced UI Components
- Floating navigation with scroll compression
- Modern card layouts with hover effects
- Professional typography (Playfair Display + Inter)
- Glassmorphism effects and backdrop blur

### 🚀 Build Optimizations
- Multi-stage Docker builds for smaller images
- Production-optimized Vite build
- Efficient caching layers
- Fast development hot-reload support

## Development Workflow

### Making Changes

1. **Frontend Changes**:
   ```bash
   # After modifying front/ files
   ./docker-scripts.sh rebuild
   ```

2. **Backend Changes**:
   ```bash
   # After modifying back/ files
   ./docker-scripts.sh rebuild
   ```

3. **Database Changes**:
   ```bash
   # Reset database
   docker compose down
   docker volume rm glowapp2_postgres_data
   ./docker-scripts.sh start
   ```

### Debugging

```bash
# View specific service logs
docker compose logs frontend -f
docker compose logs backend -f
docker compose logs postgres -f

# Execute commands in containers
docker compose exec frontend sh
docker compose exec backend bash
docker compose exec postgres psql -U glowuser -d glowdb
```

## Environment Variables

Create `.env` files as needed:

### Backend (.env in /back/)
```env
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
DATABASE_URL=postgresql://glowuser:glowpassword@postgres:5432/glowdb
```

### Frontend (.env in /front/)
```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_API_URL=http://localhost:8000
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 4173, 8000, and 5433 are available
2. **Build failures**: Run `docker system prune -f` to clean up
3. **Aurora not rendering**: Check browser console for CSS errors

### Clean Restart

```bash
./docker-scripts.sh clean
./docker-scripts.sh rebuild
```

## Production Deployment

For production deployment:

1. Update environment variables
2. Configure reverse proxy (nginx/traefik)
3. Set up SSL certificates
4. Use production database
5. Enable container orchestration (Docker Swarm/Kubernetes)

---

🌟 **Your GlowApp with Aurora background is now ready to run in Docker!** 