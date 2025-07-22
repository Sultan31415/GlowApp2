#!/bin/bash

# 🐳 Optimized Docker Build Script
# This script builds the Docker image with optimizations for faster builds

set -e

echo "🚀 Starting optimized Docker build..."

# Build arguments for better caching
BUILD_ARGS=""

# Build the image with optimizations
docker build \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --cache-from glowapp-backend:latest \
    --tag glowapp-backend:latest \
    --tag glowapp-backend:$(date +%Y%m%d-%H%M%S) \
    --file Dockerfile \
    .

echo "✅ Docker build completed successfully!"
echo "📦 Image tags:"
docker images | grep glowapp-backend

echo ""
echo "🔍 Build optimization tips:"
echo "  - Used multi-stage build to reduce final image size"
echo "  - Implemented layer caching for faster rebuilds"
echo "  - Added .dockerignore to exclude unnecessary files"
echo "  - Optimized requirements.txt grouping"
echo "  - Added health check for better monitoring" 