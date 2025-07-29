#!/bin/bash

# GlowApp Safe Backup and Deployment Script
# This script ensures safe deployment with proper backups

set -e  # Exit on any error

echo "🛡️  GlowApp Safe Backup & Deployment"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./postgres-backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="${BACKUP_DIR}/glowdb_backup_${TIMESTAMP}.sql"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to create backup
create_backup() {
    print_status "Creating database backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Create backup using docker exec
    if docker exec glowapp-postgres pg_dump -U glowuser -d glowdb > "$BACKUP_FILE"; then
        print_success "Database backup created: $BACKUP_FILE"
        print_status "Backup size: $(du -h "$BACKUP_FILE" | cut -f1)"
    else
        print_error "Failed to create database backup!"
        exit 1
    fi
}

# Function to check if containers are running
check_containers() {
    print_status "Checking container status..."
    
    if ! docker compose ps | grep -q "Up"; then
        print_warning "Containers are not running. Starting them first..."
        docker compose up -d
        sleep 10
    fi
    
    print_success "Containers are running"
}

# Function to pull latest changes
pull_changes() {
    print_status "Pulling latest changes from GitHub..."
    
    if git pull origin main; then
        print_success "Latest changes pulled successfully"
    else
        print_error "Failed to pull changes from GitHub!"
        exit 1
    fi
}

# Function to run migrations safely
run_migrations() {
    print_status "Running database migrations..."
    
    # Check if there are pending migrations
    if docker exec glowapp-backend alembic current | grep -q "head"; then
        print_success "Database is up to date"
    else
        print_warning "Pending migrations detected. Running them..."
        
        # Run migrations
        if docker exec glowapp-backend alembic upgrade head; then
            print_success "Migrations completed successfully"
        else
            print_error "Migration failed! Check the logs:"
            docker compose logs backend
            exit 1
        fi
    fi
}

# Function to rebuild and restart
rebuild_application() {
    print_status "Rebuilding application containers..."
    
    # Stop containers
    docker compose down
    
    # Rebuild with no cache
    if docker compose build --no-cache; then
        print_success "Build completed successfully"
    else
        print_error "Build failed!"
        exit 1
    fi
    
    # Start containers
    print_status "Starting containers..."
    if docker compose up -d; then
        print_success "Containers started successfully"
    else
        print_error "Failed to start containers!"
        exit 1
    fi
    
    # Wait for containers to be healthy
    print_status "Waiting for containers to be healthy..."
    sleep 30
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if containers are running
    if docker compose ps | grep -q "Up"; then
        print_success "All containers are running"
    else
        print_error "Some containers are not running!"
        docker compose ps
        exit 1
    fi
    
    # Check backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_success "Backend is healthy"
    else
        print_warning "Backend health check failed, but continuing..."
    fi
    
    # Check frontend
    if curl -f http://localhost:4173 > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend check failed, but continuing..."
    fi
}

# Function to show logs
show_logs() {
    print_status "Recent logs from containers:"
    docker compose logs --tail=20
}

# Function to cleanup old backups (keep last 5)
cleanup_old_backups() {
    print_status "Cleaning up old backups (keeping last 5)..."
    
    if [ -d "$BACKUP_DIR" ]; then
        cd "$BACKUP_DIR"
        ls -t *.sql | tail -n +6 | xargs -r rm
        cd - > /dev/null
        print_success "Old backups cleaned up"
    fi
}

# Main deployment process
main() {
    echo "🚀 Starting safe deployment process..."
    
    # Step 1: Check containers
    check_containers
    
    # Step 2: Create backup
    create_backup
    
    # Step 3: Pull changes
    pull_changes
    
    # Step 4: Rebuild application
    rebuild_application
    
    # Step 5: Run migrations
    run_migrations
    
    # Step 6: Verify deployment
    verify_deployment
    
    # Step 7: Cleanup old backups
    cleanup_old_backups
    
    # Step 8: Show logs
    show_logs
    
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "📊 Deployment Summary:"
    echo "  • Database backup: $BACKUP_FILE"
    echo "  • Backend: http://localhost:8000"
    echo "  • Frontend: http://localhost:4173"
    echo "  • Database: localhost:5433"
    echo ""
    echo "📋 Useful commands:"
    echo "  • View logs: docker compose logs -f"
    echo "  • Check status: docker compose ps"
    echo "  • Stop: docker compose down"
    echo ""
}

# Handle command line arguments
case "$1" in
    "backup-only")
        check_containers
        create_backup
        cleanup_old_backups
        ;;
    "migrate-only")
        check_containers
        run_migrations
        ;;
    "rebuild-only")
        rebuild_application
        verify_deployment
        ;;
    "verify")
        verify_deployment
        show_logs
        ;;
    "logs")
        show_logs
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [option]"
        echo ""
        echo "Options:"
        echo "  (no args)  - Full safe deployment with backup"
        echo "  backup-only - Create database backup only"
        echo "  migrate-only - Run migrations only"
        echo "  rebuild-only - Rebuild containers only"
        echo "  verify     - Verify deployment status"
        echo "  logs       - Show recent logs"
        echo "  help       - Show this help"
        ;;
    *)
        main
        ;;
esac 