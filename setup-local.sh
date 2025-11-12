#!/bin/bash

# Setup script for local development
# Run this from your project directory: ~/Desktop/shiftproto

echo "🚀 Setting up ShiftProto project..."

# Check if we're in the right directory
if [ ! -f "package-lock.json" ]; then
    echo "❌ Error: package-lock.json not found. Make sure you're in the project directory."
    exit 1
fi

echo "✅ Found package-lock.json"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "⚠️  package.json missing. Creating it..."
    # We'll need to create it
fi

echo ""
echo "📋 Next steps:"
echo "1. Make sure all project files are copied to this folder"
echo "2. Run: npm install"
echo "3. Run: npm run db:generate"
echo "4. Run: npm run db:push"
echo "5. Run: npm run db:seed"
echo "6. Run: npm run dev"
echo ""
