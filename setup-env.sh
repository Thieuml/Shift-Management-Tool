#!/bin/bash

# Quick setup script for your environment variables
# Run this to set up your local environment

echo "🔧 Setting up environment variables..."

# Your Neon Database URL
export DATABASE_URL="postgresql://neondb_owner:npg_CiquK26stvbx@ep-late-bar-a4a9pbg5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Your Upstash Redis REST API credentials
export UPSTASH_REDIS_REST_URL="https://pure-lark-35219.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="AYmTAAIncDIwOTE1NDJhMzc3MDU0ZWRmOTg4Y2RlZGZiNzM1MmQ3YXAyMzUyMTk"

# Generate NextAuth Secret if not set
if [ -z "$NEXTAUTH_SECRET" ]; then
    export NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "✅ Generated NEXTAUTH_SECRET"
fi

# Set local development URL
export NEXTAUTH_URL="http://localhost:3000"

echo "✅ Environment variables set!"
echo ""
echo "Current values:"
echo "  DATABASE_URL: ${DATABASE_URL:0:50}..."
echo "  UPSTASH_REDIS_REST_URL: $UPSTASH_REDIS_REST_URL"
echo "  UPSTASH_REDIS_REST_TOKEN: ${UPSTASH_REDIS_REST_TOKEN:0:20}..."
echo "  NEXTAUTH_URL: $NEXTAUTH_URL"
echo "  NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:20}..."
echo ""
echo "Next steps:"
echo "  1. Run: npm run db:generate"
echo "  2. Run: npm run db:migrate"
echo "  3. Run: npm run db:seed"
echo "  4. Run: npm run dev"

