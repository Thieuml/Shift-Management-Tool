# Setting Up Neon + Upstash (Step-by-Step)

Follow these steps to get your free cloud database and Redis setup.

## Step 1: Set Up Neon PostgreSQL (5 minutes)

### 1.1 Create Account
1. Go to **https://neon.tech**
2. Click **"Sign Up"** (or "Log In" if you have an account)
3. Sign up with GitHub, Google, or email

### 1.2 Create Project
1. Once logged in, click **"Create Project"**
2. Fill in:
   - **Project name**: `shiftproto` (or any name you like)
   - **Region**: Choose closest to you (e.g., `US East (Ohio)` or `EU (Frankfurt)`)
   - **PostgreSQL version**: `15` or `16` (both work fine)
3. Click **"Create Project"**

### 1.3 Get Connection String
1. After project is created, you'll see a dashboard
2. Look for **"Connection string"** section
3. Click **"Copy"** next to the connection string
   - It looks like: `postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. **Save this somewhere** - you'll need it in a moment!

### 1.4 Test Connection (Optional)
- You can click "Open SQL Editor" to test queries
- Or just proceed - we'll test it when we set up the app

---

## Step 2: Set Up Upstash Redis (3 minutes)

### 2.1 Create Account
1. Go to **https://upstash.com**
2. Click **"Sign Up"** (or "Log In" if you have an account)
3. Sign up with GitHub, Google, or email

### 2.2 Create Database
1. Once logged in, click **"Create Database"**
2. Fill in:
   - **Database name**: `shiftproto` (or any name)
   - **Type**: `Regional` (recommended for better performance)
   - **Region**: Choose **same region** as your Neon database (for best performance)
   - **Primary region**: Select the region
3. Click **"Create"**

### 2.3 Get Connection String
1. After database is created, you'll see the database details
2. Look for **"REST URL"** section
3. Click **"Copy"** next to the REST URL
   - It looks like: `redis://default:AbCdEf123456@your-db.upstash.io:6379`
4. **Save this somewhere** - you'll need it!

### 2.4 Verify Database Status
- Make sure the database shows **"Active"** status
- If it shows "Paused", click "Resume" (free tier can pause after inactivity)

---

## Step 3: Update Your .env File

Once you have both connection strings, I'll help you update the `.env` file.

**What you need:**
- ✅ Neon connection string (from Step 1.3)
- ✅ Upstash REST URL (from Step 2.3)

---

## Quick Reference

### Neon Connection String Format
```
postgresql://username:password@host.neon.tech/database?sslmode=require
```

### Upstash REST URL Format
```
redis://default:password@host.upstash.io:6379
```

---

## Troubleshooting

### Neon Issues
- **Can't find connection string?** Look in "Connection Details" section
- **Connection fails?** Make sure `?sslmode=require` is included
- **Need to reset password?** Go to Settings → Reset Password

### Upstash Issues
- **Database paused?** Click "Resume" button
- **Can't find REST URL?** Look in "REST API" section
- **Connection fails?** Make sure database is "Active" status

---

## Next Steps

After you have both connection strings:
1. Share them with me (or update `.env` yourself)
2. I'll run the database setup commands
3. Then we'll start the app!

**Ready?** Go ahead and set up Neon first, then Upstash. Once you have both connection strings, let me know and I'll help you finish the setup! 🚀
