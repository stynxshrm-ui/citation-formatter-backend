#!/bin/bash

echo "🚀 Setting up Citation Formatter Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment
echo "🔧 Setting up environment..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "📝 Created .env file from env.example"
    echo "⚠️  Please edit .env file with your configuration"
fi

# Create logs directory
mkdir -p logs

# Start services with Docker
echo "🐳 Starting services with Docker..."
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    docker-compose -f docker/docker-compose.yml up -d
    echo "✅ Services started successfully"
else
    echo "⚠️  Docker not found. Please install Docker and Docker Compose to run services."
fi

echo "✅ Setup complete!"
echo "🌐 Backend will be available at: http://localhost:3000"
echo "📊 Health check: http://localhost:3000/health"
echo "📈 Metrics: http://localhost:3000/metrics"
