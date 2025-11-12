# Getting Started with ShiftProto

## 🚀 Quick Start (Local Development)

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` and add your values:

```env
# Database (use local PostgreSQL or Neon for testing)
DATABASE_URL="postgresql://user:password@localhost:5432/shiftproto?schema=public"

# Redis (use local Redis or Upstash for testing)
REDIS_URL="redis://localhost:6379"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-in-production"
```

**Quick Setup Options:**

**Option A: Use Local Services**
- Install PostgreSQL locally or use Docker
- Install Redis locally or use Docker

**Option B: Use Cloud Services (Easier)**
- Get free Neon database: https://neon.tech (free tier available)
- Get free Upstash Redis: https://upstash.com (free tier available)
- Copy connection strings to `.env`

### Step 3: Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Seed database with sample data
npm run db:seed
```

### Step 4: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## 🌐 Deploy to Production (Vercel)

### Prerequisites

1. **GitHub/GitLab/Bitbucket account** (for code hosting)
2. **Vercel account** - Sign up at https://vercel.com
3. **Neon account** - Sign up at https://neon.tech (free tier)
4. **Upstash account** - Sign up at https://upstash.com (free tier)

### Step 1: Push Code to Git

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Push to GitHub/GitLab/Bitbucket
git remote add origin your-repo-url
git push -u origin main
```

### Step 2: Create Cloud Services

**Neon Database:**
1. Go to https://console.neon.tech
2. Click "Create Project"
3. Copy the connection string (looks like: `postgresql://user:pass@host.neon.tech/db?sslmode=require`)

**Upstash Redis:**
1. Go to https://console.upstash.com
2. Click "Create Database"
3. Choose region (pick one close to you)
4. Copy the REST URL (looks like: `redis://default:pass@host.upstash.io:port`)

### Step 3: Deploy to Vercel

**Option A: Via Vercel Dashboard (Easiest)**

1. Go to https://vercel.com/dashboard
2. Click "Add New Project"
3. Import your Git repository
4. Vercel will auto-detect Next.js

**Option B: Via Vercel CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

### Step 4: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add these variables:

```
DATABASE_URL = your-neon-connection-string
REDIS_URL = your-upstash-redis-url
NEXTAUTH_SECRET = generate-with-openssl-rand-base64-32
NEXTAUTH_URL = https://your-app.vercel.app
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

**Important:** After first deployment, update `NEXTAUTH_URL` with your actual Vercel URL!

### Step 5: Run Migrations & Seed

After deployment, connect to your production database:

```bash
# Pull production environment variables
vercel env pull .env.production

# Set DATABASE_URL from .env.production
export DATABASE_URL="your-neon-connection-string-from-env-file"

# Run migrations
npm run db:push

# Seed database
npm run db:seed
```

**Or use Vercel CLI:**

```bash
# Set production DATABASE_URL
vercel env pull .env.production

# Run migrations (using production DATABASE_URL)
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npm run db:push

# Seed database
DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npm run db:seed
```

## ✅ Verify It's Working

### Local Development:
- Visit http://localhost:3000
- Click "Operations" → Should see schedule
- Try assigning an engineer to a shift

### Production:
- Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
- Click "Operations" → Should see schedule
- Try assigning an engineer to a shift

## 🐳 Docker Alternative (Local Development)

If you prefer Docker:

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

# Then continue with Step 3 above
```

## 🛠️ Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:seed          # Seed database
npm run db:studio        # Open Prisma Studio

# Testing
npm run test             # Run all tests
npm run test:api         # Run API tests only
npm run test:e2e         # Run E2E tests

# Deployment
npm run deploy:setup     # Show deployment setup instructions
npm run deploy:seed      # Seed production database
```

## 🆘 Troubleshooting

### Database Connection Issues

**Error: Can't reach database server**
- Check `DATABASE_URL` is correct
- Verify database is running (if local)
- Check firewall/network settings
- For Neon: Ensure SSL mode is included (`?sslmode=require`)

**Error: Relation does not exist**
- Run `npm run db:push` to create tables
- Check migrations are applied

### Redis Connection Issues

**Error: Redis connection failed**
- Check `REDIS_URL` is correct
- Verify Redis is running (if local)
- For Upstash: Check database is active (not paused)

### Build Issues

**Error: Prisma Client not generated**
- Run `npm run db:generate`
- Check `DATABASE_URL` is set

**Error: Module not found**
- Run `npm install`
- Clear `.next` folder: `rm -rf .next`

### Seed Issues

**Seed doesn't run**
- Check `DATABASE_URL` is set
- Verify database connection works
- Check if data already exists (seed may skip)

## 📚 Next Steps

- Read [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guide
- Read [QUICK_DEPLOY.md](./QUICK_DEPLOY.md) for quick deployment reference
- Check [README.md](./README.md) for API documentation

## 💡 Tips

1. **Use Cloud Services for Testing**: Neon and Upstash free tiers are perfect for development
2. **Keep `.env` Local**: Never commit `.env` files to Git
3. **Use Vercel CLI**: Makes environment variable management easier
4. **Check Logs**: Vercel dashboard shows build and runtime logs
5. **Test Locally First**: Always test changes locally before deploying

## 🎉 You're Ready!

Your ShiftProto application should now be running. Start by exploring the `/ops` page to see the schedule and try assigning engineers to shifts!
