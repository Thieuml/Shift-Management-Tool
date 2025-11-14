# Quick Deployment Guide

## 🚀 Quick Start

### 1. Set up Neon Database

```bash
# Get your connection string from Neon console
export DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"

# Run migrations
npm run db:generate
npm run db:migrate
```

### 2. Set up Upstash Redis

```bash
# Get your Redis URL from Upstash console
export REDIS_URL="redis://default:password@xxx.upstash.io:6379"
```

### 3. Generate NextAuth Secret

```bash
# Generate a secure secret
openssl rand -base64 32
# Copy the output - you'll need it as NEXTAUTH_SECRET
```

### 4. Deploy to Vercel

#### Option A: Using Vercel CLI

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

#### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Add environment variables (see below)
4. Deploy

### 5. Set Environment Variables in Vercel

Go to **Settings → Environment Variables** and add:

```
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
REDIS_URL=redis://default:password@xxx.upstash.io:6379
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generated-secret>
```

### 6. Seed Production Database

```bash
# Set environment variables
export DATABASE_URL="your-neon-connection-string"
export REDIS_URL="your-upstash-connection-string"

# Seed production database
npm run db:seed:prod
```

Or use the interactive deploy script:

```bash
npm run deploy
```

## 📋 Environment Variables Checklist

- [ ] `DATABASE_URL` - Neon PostgreSQL connection string
- [ ] `REDIS_URL` - Upstash Redis connection string  
- [ ] `NEXTAUTH_URL` - Your Vercel deployment URL
- [ ] `NEXTAUTH_SECRET` - Random 32-byte base64 string

## 🔍 Verify Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Check `/ops` page loads
3. Try assigning an engineer to a shift
4. Check Vercel logs for errors

## 🆘 Troubleshooting

**Database connection issues?**
- Verify `DATABASE_URL` is correct
- Check Neon console for connection status
- Ensure SSL mode is enabled (`?sslmode=require`)

**Redis connection issues?**
- Verify `REDIS_URL` is correct
- Check Upstash dashboard for connection metrics

**Build failures?**
- Check Vercel build logs
- Ensure all environment variables are set
- Verify `package.json` scripts are correct

## 📚 Full Documentation

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

