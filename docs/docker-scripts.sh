#!/bin/bash

# GlowApp Docker Management Script
# Make sure you have Docker and Docker Compose installed

echo "🌟 GlowApp Docker Management"
echo "=========================="

case "$1" in
  "start")
    echo "🚀 Starting GlowApp containers..."
    docker compose up -d
    echo "✅ Containers started!"
    echo "🌐 Frontend: http://localhost:4173"
    echo "🔧 Backend API: http://localhost:8000"
    echo "🗄️  Database: localhost:5433"
    ;;
  
  "stop")
    echo "🛑 Stopping GlowApp containers..."
    docker compose down
    echo "✅ Containers stopped!"
    ;;
  
  "restart")
    echo "🔄 Restarting GlowApp containers..."
    docker compose down
    docker compose up -d
    echo "✅ Containers restarted!"
    ;;
  
  "build")
    echo "🔨 Building GlowApp containers..."
    docker compose build --no-cache
    echo "✅ Build complete!"
    ;;
  
  "rebuild")
    echo "🔨 Rebuilding and starting GlowApp containers..."
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    echo "✅ Rebuild and restart complete!"
    echo "🌐 Frontend: http://localhost:4173"
    echo "🔧 Backend API: http://localhost:8000"
    ;;
  
  "logs")
    echo "📋 Showing container logs..."
    docker compose logs -f
    ;;
  
  "status")
    echo "📊 Container status:"
    docker compose ps
    ;;
  
  "clean")
    echo "🧹 Cleaning up containers and images..."
    docker compose down
    docker system prune -f
    echo "✅ Cleanup complete!"
    ;;
  
  *)
    echo "Usage: $0 {start|stop|restart|build|rebuild|logs|status|clean}"
    echo ""
    echo "Commands:"
    echo "  start    - Start all containers"
    echo "  stop     - Stop all containers"
    echo "  restart  - Restart all containers"
    echo "  build    - Build all containers"
    echo "  rebuild  - Rebuild and start all containers"
    echo "  logs     - Show container logs"
    echo "  status   - Show container status"
    echo "  clean    - Clean up containers and images"
    echo ""
    echo "Example: $0 start"
    ;;
esac 