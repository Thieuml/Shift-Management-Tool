# ShiftProto

A Next.js App Router project with Tailwind CSS, Prisma (Postgres), NextAuth, SWR, and Zod.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations (or use db:push for development)
npm run db:migrate
# OR for quick development setup:
npm run db:push

# Seed the database with mock data
npm run db:seed
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Database Schema

The project includes a comprehensive Prisma schema with:
- **Countries** - Country codes, names, and timezones
- **Holidays** - Country-specific holidays
- **Sectors** - Business sectors (Healthcare, Finance, etc.)
- **Engineers** - Engineers with roles (ADMIN, OPS, ENGINEER)
- **Shift Templates** - Reusable shift patterns
- **Shifts** - Individual shift instances
- **Assignments** - Engineer-to-shift assignments

## Seed Data

The seed file (`prisma/seed.ts`) includes:
- 4 countries (US, UK, France, Germany)
- 12 holidays across countries
- 9 sectors
- 13 engineers with various roles
- 7 shift templates
- 30 days of shifts
- Sample assignments

## Pages

- `/ops` - Operations page
- `/admin` - Admin page
- `/payroll` - Payroll page
