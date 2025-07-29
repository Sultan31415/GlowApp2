#!/bin/bash

# Emergency Rollback Script for GlowApp
# Use this if deployment goes wrong and you need to restore from backup

set -e

echo "🚨 EMERGENCY ROLLBACK SCRIPT"
echo "============================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

# Check if backup file is provided
if [ -z "$1" ]; then
    print_error "Usage: $0 <backup_file.sql>"
    echo ""
    echo "Available backups:"
    if [ -d "./postgres-backups" ]; then
        ls -la ./postgres-backups/*.sql 2>/dev/null || echo "No backups found"
    else
        echo "No backup directory found"
    fi
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "Backup file not found: $BACKUP_FILE"
    exit 1
fi

print_warning "⚠️  WARNING: This will RESTORE the database from backup!"
print_warning "This will OVERWRITE all current data!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_status "Rollback cancelled"
    exit 0
fi

print_status "Starting emergency rollback..."

# Stop containers
print_status "Stopping containers..."
docker compose down

# Start only postgres
print_status "Starting PostgreSQL container..."
docker compose up -d postgres

# Wait for postgres to be ready
print_status "Waiting for PostgreSQL to be ready..."
sleep 15

# Drop and recreate database
print_status "Dropping and recreating database..."
docker exec glowapp-postgres psql -U glowuser -d postgres -c "DROP DATABASE IF EXISTS glowdb;"
docker exec glowapp-postgres psql -U glowuser -d postgres -c "CREATE DATABASE glowdb;"

# Restore from backup
print_status "Restoring from backup: $BACKUP_FILE"
if docker exec -i glowapp-postgres psql -U glowuser -d glowdb < "$BACKUP_FILE"; then
    print_success "Database restored successfully!"
else
    print_error "Failed to restore database!"
    exit 1
fi

# Start all containers
print_status "Starting all containers..."
docker compose up -d

# Wait for containers to be ready
print_status "Waiting for containers to be ready..."
sleep 30

# Verify restoration
print_status "Verifying restoration..."
if docker compose ps | grep -q "Up"; then
    print_success "All containers are running"
else
    print_error "Some containers failed to start!"
    docker compose ps
    exit 1
fi

print_success "🎉 Emergency rollback completed successfully!"
echo ""
echo "📊 Rollback Summary:"
echo "  • Restored from: $BACKUP_FILE"
echo "  • All containers restarted"
echo "  • Database restored to backup state"
echo ""
echo "📋 Next steps:"
echo "  • Check application functionality"
echo "  • Review logs: docker compose logs -f"
echo "  • If issues persist, consider manual intervention" 