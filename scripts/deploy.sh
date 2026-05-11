#!/bin/bash

# LogicLens Production Deployment Script

echo "🚀 Starting LogicLens Deployment..."

# 1. Check for .env file
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file based on .env.example before deploying."
    exit 1
fi

# 2. Build and start containers
echo "📦 Building and starting containers..."
docker-compose up -d --build

# 3. Run Database Migrations
echo "🗄️ Running database migrations..."
docker exec logiclens-backend pnpm --filter "@workspace/db" run push

echo "✅ Deployment Complete!"
echo "🌐 Frontend: http://localhost"
echo "📡 Backend: http://localhost:8082"
