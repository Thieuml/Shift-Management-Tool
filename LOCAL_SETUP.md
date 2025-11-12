# Local Setup Guide

You're running this on your local machine. Follow these steps:

## Step 1: Find Your Project Directory

The project files are in your workspace. Find where you saved/cloned the project:

```bash
# Common locations:
cd ~/Desktop/shiftproto
# OR
cd ~/Documents/shiftproto
# OR
cd ~/projects/shiftproto
# OR wherever you saved it
```

**If you're using Cursor/VS Code:**
- The project should be open in your editor
- Check the folder name in the sidebar
- Open terminal in that folder (Terminal → New Terminal)

## Step 2: Install Node.js (if not installed)

### Check if Node.js is installed:
```bash
node --version
npm --version
```

### If not installed, install Node.js:

**macOS (using Homebrew):**
```bash
brew install node
```

**macOS (download installer):**
- Go to https://nodejs.org
- Download LTS version
- Install the .pkg file

**Windows:**
- Go to https://nodejs.org
- Download LTS version
- Run the installer

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Step 3: Navigate to Project Directory

Once you know where your project is:

```bash
# Replace with your actual path
cd /path/to/your/project

# Verify you're in the right place (should see package.json)
ls package.json
```

## Step 4: Install Dependencies

```bash
npm install
```

This will install all required packages (takes 1-2 minutes).

## Step 5: Set Up Environment Variables

Make sure you have a `.env` file with your database and Redis URLs:

```bash
# Check if .env exists
ls -la .env

# If it doesn't exist, copy from example
cp .env.example .env

# Then edit .env with your actual values:
# - DATABASE_URL (from Neon)
# - REDIS_URL (from Upstash)
# - NEXTAUTH_SECRET (already generated)
```

## Step 6: Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Create database tables
npm run db:push

# Add sample data
npm run db:seed
```

## Step 7: Start the Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

## Step 8: Open in Browser

Visit: **http://localhost:3000**

## Quick Troubleshooting

### "command not found: npm"
- Node.js is not installed → Install from step 2

### "no such file or directory"
- You're in the wrong directory → Find your project folder (step 1)

### "Cannot find module"
- Dependencies not installed → Run `npm install`

### Port 3000 already in use
```bash
# Use different port
PORT=3001 npm run dev
```

## Still Having Issues?

1. **Check your current directory:**
   ```bash
   pwd
   ls
   ```

2. **Verify Node.js is installed:**
   ```bash
   node --version
   npm --version
   ```

3. **Make sure you're in the project root:**
   - Should see `package.json` file
   - Should see `app` folder
   - Should see `prisma` folder

4. **Check if .env file exists:**
   ```bash
   ls -la .env
   ```

---

**Need help?** Share:
- Your current directory (`pwd`)
- Node.js version (`node --version`)
- Any error messages you see
