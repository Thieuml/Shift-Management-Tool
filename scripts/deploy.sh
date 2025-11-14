#!/bin/bash

# Deployment script for Vercel + Neon + Upstash
# This script helps set up and deploy the application

set -e

echo "🚀 Shift Management App - Deployment Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependency() {
    if ! command -v $1 &> /dev/null; then
        echo -e "${RED}❌ $1 is not installed${NC}"
        echo "   Please install $1 first"
        exit 1
    else
        echo -e "${GREEN}✅ $1 is installed${NC}"
    fi
}

echo "Checking dependencies..."
check_dependency "node"
check_dependency "npm"
check_dependency "vercel"
echo ""

# Check environment variables
check_env_var() {
    if [ -z "${!1}" ]; then
        echo -e "${YELLOW}⚠️  $1 is not set${NC}"
        return 1
    else
        echo -e "${GREEN}✅ $1 is set${NC}"
        return 0
    fi
}

echo "Checking environment variables..."
ENV_VARS_OK=true

check_env_var "DATABASE_URL" || ENV_VARS_OK=false
check_env_var "REDIS_URL" || ENV_VARS_OK=false
check_env_var "NEXTAUTH_URL" || ENV_VARS_OK=false
check_env_var "NEXTAUTH_SECRET" || ENV_VARS_OK=false

echo ""

if [ "$ENV_VARS_OK" = false ]; then
    echo -e "${YELLOW}⚠️  Some environment variables are missing${NC}"
    echo "   Please set them before deploying:"
    echo "   - DATABASE_URL (from Neon)"
    echo "   - REDIS_URL (from Upstash)"
    echo "   - NEXTAUTH_URL (your Vercel URL)"
    echo "   - NEXTAUTH_SECRET (generate with: openssl rand -base64 32)"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Generate Prisma Client
echo ""
echo "📦 Generating Prisma Client..."
npm run db:generate

# Run migrations
echo ""
echo "🗄️  Running database migrations..."
read -p "Run migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:migrate
fi

# Deploy to Vercel
echo ""
echo "🚀 Deploying to Vercel..."
read -p "Deploy now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
fi

# Seed database
echo ""
echo "🌱 Seed production database?"
read -p "Seed database? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  WARNING: This will clear existing data!${NC}"
    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        FORCE_SEED=true npm run db:seed
    fi
fi

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify your deployment at: https://your-app.vercel.app"
echo "2. Check Vercel logs for any errors"
echo "3. Test the application functionality"
echo "4. Set up monitoring and alerts"

