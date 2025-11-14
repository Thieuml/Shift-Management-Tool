# How to Run Deployment - Step by Step

Follow these commands in order to deploy your app.

## Prerequisites Check

First, make sure you have the required tools:

```bash
# Check if you have Node.js
node --version

# Check if you have npm
npm --version

# Install Vercel CLI (if not installed)
npm i -g vercel
```

## Step 1: Get Your Database Connection Strings

### Neon (PostgreSQL)

1. Go to https://console.neon.tech
2. Create a new project (or use existing)
3. Copy the connection string (looks like: `postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require`)
4. Save it - you'll need it as `DATABASE_URL`

### Upstash (Redis)

1. Go to https://console.upstash.com
2. Create a new Redis database
3. Copy the Redis URL (looks like: `redis://default:password@xxx.upstash.io:6379`)
4. Save it - you'll need it as `REDIS_URL`

## Step 2: Set Up Local Environment Variables

Create a `.env.local` file (or export them in your terminal):

```bash
# Option A: Create .env.local file
cat > .env.local << EOF
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
REDIS_URL=redis://default:password@xxx.upstash.io:6379
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
EOF

# Option B: Export in terminal (temporary)
export DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"
export REDIS_URL="redis://default:password@xxx.upstash.io:6379"
export NEXTAUTH_URL="http://localhost:3000"
export NEXTAUTH_SECRET="your-secret-here"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
# Copy the output and use it as NEXTAUTH_SECRET
```

## Step 3: Run Database Migrations

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations to create tables
npm run db:migrate
```

## Step 4: Deploy to Vercel

### Option A: Using the Interactive Script

```bash
# Make sure you're in the project directory
cd /Users/matthieu/Desktop/shiftproto

# Run the deployment script
npm run deploy
```

The script will:
- Check dependencies
- Verify environment variables
- Ask if you want to run migrations
- Deploy to Vercel
- Ask if you want to seed the database

### Option B: Manual Deployment

```bash
# Login to Vercel (first time only)
vercel login

# Deploy to production
vercel --prod
```

Follow the prompts:
- Link to existing project? (y/n) - Choose `n` for first deployment
- Project name? - Enter a name or press Enter for default
- Directory? - Press Enter for `./`
- Override settings? - Press Enter for `n`

## Step 5: Set Environment Variables in Vercel

After deployment, you need to add environment variables in Vercel:

### Via Vercel Dashboard:

1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - `DATABASE_URL` = Your Neon connection string
   - `REDIS_URL` = Your Upstash Redis URL
   - `NEXTAUTH_URL` = Your Vercel URL (e.g., `https://your-app.vercel.app`)
   - `NEXTAUTH_SECRET` = The secret you generated
5. Select environments: **Production**, **Preview**, **Development**
6. Click **Save**

### Via Vercel CLI:

```bash
# Add each environment variable
vercel env add DATABASE_URL
# Paste your Neon connection string when prompted
# Select: Production, Preview, Development

vercel env add REDIS_URL
# Paste your Upstash Redis URL when prompted
# Select: Production, Preview, Development

vercel env add NEXTAUTH_URL
# Enter your Vercel URL: https://your-app.vercel.app
# Select: Production, Preview, Development

vercel env add NEXTAUTH_SECRET
# Paste your generated secret
# Select: Production, Preview, Development
```

## Step 6: Redeploy to Apply Environment Variables

After setting environment variables, trigger a new deployment:

```bash
vercel --prod
```

Or go to Vercel dashboard → Deployments → Click "..." → "Redeploy"

## Step 7: Seed Production Database

```bash
# Set environment variables locally
export DATABASE_URL="your-neon-connection-string"
export REDIS_URL="your-upstash-connection-string"

# Seed production database
npm run db:seed:prod
```

**Note:** This will ask for confirmation since it clears existing data.

## Step 8: Verify Deployment

1. Visit your Vercel URL: `https://your-app.vercel.app`
2. Check that the homepage loads
3. Go to `/ops` page
4. Try assigning an engineer to a shift
5. Check Vercel logs if there are errors:
   - Go to Vercel Dashboard → Your Project → Functions → Logs

## Quick Command Reference

```bash
# Full deployment flow (after setting up accounts)
npm run db:generate          # Generate Prisma Client
npm run db:migrate          # Run migrations
vercel --prod               # Deploy to Vercel
npm run db:seed:prod        # Seed production database

# Or use the interactive script
npm run deploy
```

## Troubleshooting

**"Command not found: vercel"**
```bash
npm i -g vercel
```

**"DATABASE_URL not set"**
```bash
# Make sure you've set it in Vercel dashboard or exported it locally
export DATABASE_URL="your-connection-string"
```

**"Migration failed"**
```bash
# Check your DATABASE_URL is correct
# Try: npm run db:push (for development, bypasses migrations)
```

**"Build failed on Vercel"**
- Check Vercel build logs
- Ensure all environment variables are set
- Verify `package.json` scripts are correct

## Need Help?

- Check `DEPLOYMENT.md` for detailed documentation
- Check `QUICK_DEPLOY.md` for quick reference
- Vercel logs: Dashboard → Your Project → Functions → Logs

