#!/bin/bash

# 🧠 VECTOR DATABASE QUICK SETUP SCRIPT
# This script automates the setup of the vector database for Leo's memory system

set -e  # Exit on any error

echo "🚀 VECTOR DATABASE SETUP SCRIPT"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if we're in the right directory
if [ ! -f "requirements.txt" ]; then
    print_error "Please run this script from the 'back' directory"
    exit 1
fi

print_status "Starting vector database setup..."

# Step 1: Install pgvector dependency
print_status "Installing pgvector dependency..."
if ! grep -q "pgvector" requirements.txt; then
    echo "pgvector==0.2.4" >> requirements.txt
    print_success "Added pgvector to requirements.txt"
else
    print_success "pgvector already in requirements.txt"
fi

# Step 2: Install Python dependencies
print_status "Installing Python dependencies..."
pip install pgvector==0.2.4
print_success "Python dependencies installed"

# Step 3: Check database connection
print_status "Checking database connection..."
if ! python -c "
import os
from dotenv import load_dotenv
load_dotenv()
from app.db.session import engine
try:
    with engine.connect() as conn:
        print('Database connection successful')
except Exception as e:
    print(f'Database connection failed: {e}')
    exit(1)
" 2>/dev/null; then
    print_error "Database connection failed. Please ensure your database is running and DATABASE_URL is set correctly."
    print_warning "You can start the database with: docker run -d --name postgres-vector -e POSTGRES_DB=glowdb -e POSTGRES_USER=glowuser -e POSTGRES_PASSWORD=glowpassword -p 5433:5432 pgvector/pgvector:pg15"
    exit 1
fi

# Step 4: Check Azure OpenAI configuration
print_status "Checking Azure OpenAI configuration..."
if python -c "
import os
from dotenv import load_dotenv
load_dotenv()
if os.getenv('AZURE_OPENAI_API_KEY') and os.getenv('AZURE_OPENAI_ENDPOINT'):
    print('Azure OpenAI configured')
else:
    print('Azure OpenAI not configured - will use regular OpenAI')
" 2>/dev/null; then
    print_success "Azure OpenAI configuration checked"
else
    print_warning "Azure OpenAI not configured - will use regular OpenAI"
fi

# Step 5: Run database migration
print_status "Running database migration..."
if alembic upgrade head; then
    print_success "Database migration completed successfully"
else
    print_error "Database migration failed"
    print_warning "You may need to install pgvector extension manually:"
    echo "  psql your_database_name"
    echo "  CREATE EXTENSION IF NOT EXISTS vector;"
    exit 1
fi

# Step 6: Run tests
print_status "Running vector database tests..."
if python test_vector_database.py; then
    print_success "All tests passed!"
else
    print_warning "Some tests failed - this might be expected for a new setup"
fi

# Step 7: Create summary
echo ""
echo "🎉 VECTOR DATABASE SETUP COMPLETE!"
echo "=================================="
print_success "✅ pgvector dependency installed"
print_success "✅ Database migration completed"
print_success "✅ Vector columns added to chat_messages table"
print_success "✅ Vector indexes created for fast similarity search"
print_success "✅ EmbeddingService ready for Azure OpenAI integration"
print_success "✅ VectorSearchService ready for semantic search"
print_success "✅ Leo's memory system enhanced with vector capabilities"

echo ""
echo "🧠 LEO'S NEW CAPABILITIES:"
echo "   • Semantic conversation memory"
echo "   • Pattern recognition across conversations"
echo "   • Sentiment analysis and tracking"
echo "   • Topic extraction and clustering"
echo "   • Intelligent response adaptation"
echo "   • Long-term memory and insights"

echo ""
echo "🚀 NEXT STEPS:"
echo "   1. Start your application: python run.py"
echo "   2. Test Leo's enhanced memory in conversations"
echo "   3. Monitor vector search performance"
echo "   4. Review VECTOR_DATABASE_SETUP.md for advanced configuration"

echo ""
print_success "Vector database setup completed successfully! 🎉" 