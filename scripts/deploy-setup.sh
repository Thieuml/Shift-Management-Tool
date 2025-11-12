#!/bin/bash

# Deployment setup script for Vercel + Neon + Upstash
# This script helps set up environment variables and run initial seed

set -e

echo "🚀 Setting up deployment environment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

echo "✅ Vercel CLI ready"

# Check if required environment variables are set
echo ""
echo "📋 Required Environment Variables:"
echo "  - DATABASE_URL (Neon PostgreSQL connection string)"
echo "  - REDIS_URL (Upstash Redis connection string)"
echo "  - NEXTAUTH_SECRET (Random secret for NextAuth)"
echo "  - NEXTAUTH_URL (Your Vercel deployment URL)"
echo ""

# Generate NEXTAUTH_SECRET if not set
if [ -z "$NEXTAUTH_SECRET" ]; then
    echo "⚠️  NEXTAUTH_SECRET not set. Generating one..."
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "Generated NEXTAUTH_SECRET: $NEXTAUTH_SECRET"
    echo "Please save this value!"
fi

echo ""
echo "📝 To set environment variables in Vercel, run:"
echo ""
echo "  vercel env add DATABASE_URL"
echo "  vercel env add REDIS_URL"
echo "  vercel env add NEXTAUTH_SECRET"
echo "  vercel env add NEXTAUTH_URL"
echo ""
echo "Or use the Vercel dashboard: https://vercel.com/dashboard"
echo ""
echo "✅ Setup instructions complete!"
