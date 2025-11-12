# Running ShiftProto Locally

Your ShiftProto application is ready to run! Here's how:

## Quick Start

```bash
# Make sure you're in the project directory
cd /workspace

# Start the development server
npm run dev
```

The server will start on **http://localhost:3000**

## Access the Application

Once the server is running, open your browser and go to:

**Main URL:** http://localhost:3000

### Available Pages:

- **Homepage:** http://localhost:3000
- **Operations:** http://localhost:3000/ops
- **Admin:** http://localhost:3000/admin  
- **Payroll:** http://localhost:3000/payroll

## What's Already Set Up

✅ **Database:** Connected to Neon PostgreSQL
✅ **Redis:** Connected to Upstash  
✅ **Sample Data:** Loaded (4 countries, 13 engineers, 270 shifts)
✅ **Environment:** Configured in `.env`

## Verify Everything Works

1. **Check Homepage:**
   - Visit http://localhost:3000
   - You should see the welcome page with links to Operations, Admin, and Payroll

2. **Check Operations Page:**
   - Click "Operations" or visit http://localhost:3000/ops
   - You should see the schedule with shifts
   - Try assigning an engineer to a shift

3. **Test API:**
   - Visit http://localhost:3000/api/schedule?country=FR&from=2024-01-01&to=2024-01-31
   - You should see JSON data with shifts

## Troubleshooting

### Port Already in Use

If port 3000 is busy:
```bash
# Use a different port
PORT=3001 npm run dev
```

### Server Won't Start

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Try again
npm run dev
```

### Database Connection Issues

```bash
# Test database connection
npm run db:studio
# This opens Prisma Studio - if it works, database is connected
```

### Redis Connection Issues

Check your `.env` file has the correct `REDIS_URL`

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:studio    # Open database GUI
npm run db:seed      # Reseed database (clears existing data)
```

## Stop the Server

Press `Ctrl+C` in the terminal where the server is running.

---

**Your app is ready!** Just run `npm run dev` and visit http://localhost:3000 🚀
