# Deploy Now - Quick Commands

You have your connection strings ready! Here's exactly what to run:

## Step 1: Set Environment Variables Locally

```bash
# Run the setup script
source setup-env.sh

# OR manually export them:
export DATABASE_URL="postgresql://neondb_owner:npg_CiquK26stvbx@ep-late-bar-a4a9pbg5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export UPSTASH_REDIS_REST_URL="https://pure-lark-35219.upstash.io"
export UPSTASH_REDIS_REST_TOKEN="AYmTAAIncDIwOTE1NDJhMzc3MDU0ZWRmOTg4Y2RlZGZiNzM1MmQ3YXAyMzUyMTk"
export NEXTAUTH_SECRET=$(openssl rand -base64 32)
export NEXTAUTH_URL="http://localhost:3000"
```

## Step 2: Install Dependencies & Setup Database

```bash
# Install npm packages (including @upstash/redis)
npm install

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

## Step 3: Test Locally

```bash
# Start dev server
npm run dev
```

Visit http://localhost:3000 and test the app!

## Step 4: Deploy to Vercel

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## Step 5: Set Environment Variables in Vercel

After deployment, go to Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

```
DATABASE_URL=postgresql://neondb_owner:npg_CiquK26stvbx@ep-late-bar-a4a9pbg5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

UPSTASH_REDIS_REST_URL=https://pure-lark-35219.upstash.io

UPSTASH_REDIS_REST_TOKEN=AYmTAAIncDIwOTE1NDJhMzc3MDU0ZWRmOTg4Y2RlZGZiNzM1MmQ3YXAyMzUyMTk

NEXTAUTH_URL=https://your-app.vercel.app

NEXTAUTH_SECRET=<paste-the-generated-secret-from-step-1>
```

**Important:** Replace `https://your-app.vercel.app` with your actual Vercel URL after deployment.

## Step 6: Redeploy to Apply Environment Variables

```bash
vercel --prod
```

Or trigger a redeploy from Vercel dashboard.

## Step 7: Seed Production Database

```bash
# Make sure environment variables are set
export DATABASE_URL="postgresql://neondb_owner:npg_CiquK26stvbx@ep-late-bar-a4a9pbg5-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Seed production
npm run db:seed:prod
```

## That's It! 🎉

Your app should now be live at your Vercel URL!

