# Deployment Guide: Vercel + Neon + Upstash

This guide walks you through deploying ShiftProto to Vercel with Neon (PostgreSQL) and Upstash (Redis).

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **Neon Account** - Sign up at [neon.tech](https://neon.tech)
3. **Upstash Account** - Sign up at [upstash.com](https://upstash.com)
4. **GitHub/GitLab/Bitbucket** - Your code repository

## Step 1: Set Up Neon Database

1. Go to [Neon Console](https://console.neon.tech)
2. Create a new project
3. Copy the **Connection String** (it looks like: `postgresql://user:password@host/database?sslmode=require`)
4. Save this for Step 3

### Create Database Schema

After creating your Neon project, run migrations:

```bash
# Set your DATABASE_URL
export DATABASE_URL="your-neon-connection-string"

# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push
```

## Step 2: Set Up Upstash Redis

1. Go to [Upstash Console](https://console.upstash.com)
2. Create a new Redis database
3. Choose a region close to your Vercel deployment region
4. Copy the **REST URL** (it looks like: `redis://default:password@host:port`)
5. Save this for Step 3

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New Project"
   - Import your Git repository
   - Vercel will auto-detect Next.js

2. **Configure Environment Variables**
   - In project settings, go to "Environment Variables"
   - Add the following variables:

   ```
   DATABASE_URL=your-neon-connection-string
   REDIS_URL=your-upstash-redis-url
   NEXTAUTH_SECRET=generate-a-random-secret-here
   NEXTAUTH_URL=https://your-app.vercel.app
   ```

   **Generate NEXTAUTH_SECRET:**
   ```bash
   openssl rand -base64 32
   ```

3. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run vercel-build`
   - Output Directory: `.next` (default)
   - Install Command: `npm install`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Link Project**
   ```bash
   vercel link
   ```

4. **Set Environment Variables**
   ```bash
   vercel env add DATABASE_URL
   vercel env add REDIS_URL
   vercel env add NEXTAUTH_SECRET
   vercel env add NEXTAUTH_URL
   ```

5. **Deploy**
   ```bash
   vercel --prod
   ```

## Step 4: Run Database Seed

After deployment, seed your database with initial data:

### Option A: Via Vercel CLI

```bash
# Set production environment
vercel env pull .env.production

# Run seed
npm run deploy:seed
```

### Option B: Via Vercel Dashboard

1. Go to your project's "Deployments" tab
2. Click on the latest deployment
3. Go to "Functions" → "View Function Logs"
4. Or use Vercel's built-in terminal (if available)

### Option C: Via Local Script

Create a script that connects to your production database:

```bash
# Set production DATABASE_URL
export DATABASE_URL="your-neon-production-connection-string"

# Run seed
npm run db:seed
```

## Step 5: Verify Deployment

1. **Check Application**
   - Visit your Vercel URL: `https://your-app.vercel.app`
   - Verify pages load correctly

2. **Check Database Connection**
   - Navigate to `/ops` page
   - Verify schedule data loads

3. **Check Redis Connection**
   - Try assigning an engineer to a shift
   - Verify Redis lock works (no concurrent assignment errors)

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db?sslmode=require` |
| `REDIS_URL` | Upstash Redis connection string | `redis://default:pass@host:port` |
| `NEXTAUTH_SECRET` | Secret for NextAuth session encryption | Random 32+ character string |
| `NEXTAUTH_URL` | Your Vercel deployment URL | `https://your-app.vercel.app` |

## Troubleshooting

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check Neon dashboard for connection status
- Ensure IP allowlist includes Vercel IPs (if required)
- Verify SSL mode is set correctly (`?sslmode=require`)

### Redis Connection Issues

- Verify `REDIS_URL` is correct
- Check Upstash dashboard for database status
- Ensure database is in same region as Vercel deployment
- Verify Redis database is active (not paused)

### Build Failures

- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `prisma generate` runs during build
- Check Node.js version compatibility

### Seed Script Issues

- Verify database is accessible
- Check if data already exists (seed may skip)
- Review Prisma migration status
- Check database connection limits

## Post-Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Database seeded with initial data
- [ ] Application accessible via Vercel URL
- [ ] Database connections working
- [ ] Redis connections working
- [ ] Authentication working (if configured)
- [ ] API endpoints responding correctly

## Continuous Deployment

Once set up, Vercel will automatically deploy on every push to your main branch. Make sure:

1. Environment variables are set in Vercel dashboard
2. Database migrations are included in your build process
3. Seed script runs only when needed (not on every deploy)

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Neon Documentation](https://neon.tech/docs)
- [Upstash Documentation](https://docs.upstash.com)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
