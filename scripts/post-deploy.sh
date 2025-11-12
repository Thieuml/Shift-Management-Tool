#!/bin/bash

# Post-deployment script for Vercel
# This script runs migrations and seeds the database after deployment

set -e

echo "🚀 Running post-deployment setup..."

# Generate Prisma Client
echo "📦 Generating Prisma Client..."
npm run db:generate

# Run migrations
echo "🔄 Running database migrations..."
npm run db:push

# Seed database (only if empty)
echo "🌱 Seeding database..."
npm run db:seed || echo "⚠️  Seed skipped (database may already contain data)"

echo "✅ Post-deployment setup complete!"
