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
npm run db:generate
npm run db:push
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Pages

- `/ops` - Operations page
- `/admin` - Admin page
- `/payroll` - Payroll page
