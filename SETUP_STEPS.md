# Step-by-Step Setup Guide

Follow these steps in your terminal (in Cursor, open Terminal: `Ctrl+`` or `Cmd+``):

## Step 1: Verify You're in the Project Folder

```bash
pwd
# Should show: /Users/matthieu/Desktop/shiftproto

ls
# Should show files like: package.json, app/, prisma/, etc.
```

## Step 2: Check Node.js Installation

```bash
node --version
npm --version
```

**If you see version numbers** → Continue to Step 3
**If you see "command not found"** → Install Node.js from https://nodejs.org

## Step 3: Install Dependencies

```bash
npm install
```

This will take 1-2 minutes. You'll see lots of output.

## Step 4: Verify .env File

```bash
cat .env
```

You should see your DATABASE_URL and REDIS_URL configured.

**If .env doesn't exist or is empty**, we'll create it with your credentials.

## Step 5: Set Up Database

```bash
# Generate Prisma Client
npm run db:generate

# Create database tables
npm run db:push

# Add sample data
npm run db:seed
```

## Step 6: Start the Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
```

## Step 7: Open in Browser

Visit: **http://localhost:3000**

---

## If Something Goes Wrong

Share the error message and I'll help you fix it!
