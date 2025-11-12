# Quick Deployment Guide

## 🚀 Deploy in 5 Minutes

### 1. Create Services (2 min)

**Neon Database:**
1. Go to https://neon.tech → Sign up/Login
2. Create new project
3. Copy connection string (looks like: `postgresql://user:pass@host/db?sslmode=require`)

**Upstash Redis:**
1. Go to https://upstash.com → Sign up/Login
2. Create Redis database
3. Copy REST URL (looks like: `redis://default:pass@host:port`)

### 2. Deploy to Vercel (1 min)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts, then:
vercel --prod
```

### 3. Set Environment Variables (1 min)

In Vercel Dashboard → Your Project → Settings → Environment Variables:

```
DATABASE_URL = your-neon-connection-string
REDIS_URL = your-upstash-redis-url
NEXTAUTH_SECRET = $(openssl rand -base64 32)
NEXTAUTH_URL = https://your-app.vercel.app
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 4. Run Migrations & Seed (1 min)

After first deployment:

```bash
# Pull production env vars
vercel env pull .env.production

# Set DATABASE_URL
export DATABASE_URL="your-neon-connection-string"

# Run migrations
npm run db:push

# Seed database
npm run db:seed
```

### 5. Verify ✅

Visit your Vercel URL and check:
- ✅ Homepage loads
- ✅ `/ops` page shows schedule
- ✅ Can assign engineers to shifts

## 🎉 Done!

Your app is now live at `https://your-app.vercel.app`

## Troubleshooting

**Database connection fails?**
- Check `DATABASE_URL` format
- Verify Neon database is active
- Ensure SSL mode: `?sslmode=require`

**Redis connection fails?**
- Check `REDIS_URL` format  
- Verify Upstash database is active
- Check database region matches Vercel

**Build fails?**
- Check Vercel build logs
- Verify all env vars are set
- Ensure `prisma generate` runs (auto via postinstall)

## Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.
