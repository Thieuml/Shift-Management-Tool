# Database & Redis Setup Guide

You need a PostgreSQL database and Redis instance to run ShiftProto locally.

## Option 1: Use Free Cloud Services (Easiest) ⭐ Recommended

### Neon PostgreSQL (Free Tier)

1. Go to https://neon.tech
2. Sign up/login (free account)
3. Click "Create Project"
4. Choose a name and region
5. Copy the **Connection String** (looks like: `postgresql://user:pass@host.neon.tech/db?sslmode=require`)
6. Update `.env`:
   ```
   DATABASE_URL="your-neon-connection-string-here"
   ```

### Upstash Redis (Free Tier)

1. Go to https://upstash.com
2. Sign up/login (free account)
3. Click "Create Database"
4. Choose a name and region (pick same as Neon for best performance)
5. Copy the **REST URL** (looks like: `redis://default:pass@host.upstash.io:port`)
6. Update `.env`:
   ```
   REDIS_URL="your-upstash-redis-url-here"
   ```

**Advantages:**
- ✅ No local installation needed
- ✅ Free tier available
- ✅ Works immediately
- ✅ Can use same credentials for production later

## Option 2: Local Installation

### PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb shiftproto
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb shiftproto
```

**Windows:**
- Download from https://www.postgresql.org/download/windows/
- Install and create database `shiftproto`

Then update `.env`:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/shiftproto?schema=public"
```

### Redis

**macOS (Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install redis-server
sudo systemctl start redis
```

**Windows:**
- Download from https://github.com/microsoftarchive/redis/releases
- Or use WSL2

Then update `.env`:
```
REDIS_URL="redis://localhost:6379"
```

## Option 3: Docker (Quick Setup)

If you have Docker installed:

```bash
# Start PostgreSQL
docker run --name postgres-shiftproto \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=shiftproto \
  -p 5432:5432 \
  -d postgres:15

# Start Redis
docker run --name redis-shiftproto \
  -p 6379:6379 \
  -d redis:7-alpine

# Update .env
DATABASE_URL="postgresql://postgres:password@localhost:5432/shiftproto?schema=public"
REDIS_URL="redis://localhost:6379"
```

## After Setup

Once you have your DATABASE_URL and REDIS_URL set in `.env`, run:

```bash
# Generate Prisma Client
npm run db:generate

# Create database tables
npm run db:push

# Add sample data
npm run db:seed

# Start the app
npm run dev
```

## Verify Connection

Test your database connection:
```bash
npm run db:studio
```
This opens Prisma Studio where you can view your database.

## Need Help?

- **Neon Docs**: https://neon.tech/docs
- **Upstash Docs**: https://docs.upstash.com
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
