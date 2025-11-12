# Vercel Environment Variables Setup

This guide helps you set up environment variables in Vercel for your deployment.

## Quick Setup via Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production

# Also add for preview and development environments
vercel env add DATABASE_URL preview
vercel env add REDIS_URL preview
vercel env add NEXTAUTH_SECRET preview
vercel env add NEXTAUTH_URL preview

vercel env add DATABASE_URL development
vercel env add REDIS_URL development
vercel env add NEXTAUTH_SECRET development
vercel env add NEXTAUTH_URL development
```

## Manual Setup via Vercel Dashboard

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **Settings** → **Environment Variables**
3. Add each variable:

### DATABASE_URL
- **Value**: Your Neon PostgreSQL connection string
- **Example**: `postgresql://user:password@host.neon.tech/database?sslmode=require`
- **Environments**: Production, Preview, Development

### REDIS_URL
- **Value**: Your Upstash Redis connection string
- **Example**: `redis://default:password@host.upstash.io:port`
- **Environments**: Production, Preview, Development

### NEXTAUTH_SECRET
- **Value**: Generate with `openssl rand -base64 32`
- **Example**: `aBc123XyZ456...` (32+ characters)
- **Environments**: Production, Preview, Development

### NEXTAUTH_URL
- **Value**: Your Vercel deployment URL
- **Example**: `https://your-app.vercel.app`
- **Environments**: Production, Preview, Development
- **Note**: Update after first deployment

## Generate NEXTAUTH_SECRET

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Or use online generator
# https://generate-secret.vercel.app/32
```

## Verify Environment Variables

After setting up, verify they're configured:

```bash
# Pull environment variables locally (for testing)
vercel env pull .env.local

# Check variables are set
vercel env ls
```

## Important Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use different secrets** for production/preview/development
3. **Update NEXTAUTH_URL** after first deployment
4. **Restart deployments** after adding new environment variables
5. **Check variable names** - They're case-sensitive

## Troubleshooting

### Variables not available at build time
- Ensure variables are added to the correct environment (Production/Preview/Development)
- Redeploy after adding variables

### Database connection fails
- Verify `DATABASE_URL` format is correct
- Check Neon dashboard for connection status
- Ensure SSL mode is included (`?sslmode=require`)

### Redis connection fails
- Verify `REDIS_URL` format is correct
- Check Upstash dashboard for database status
- Ensure database is not paused
