# Migration Guide

## Generating Migrations

After setting up your `.env` file with a valid `DATABASE_URL`, run:

```bash
npm run db:migrate
```

This will:
1. Create a new migration based on your schema
2. Apply it to your database
3. Generate the Prisma Client

## Seeding the Database

After migrations are applied, seed your database with mock data:

```bash
npm run db:seed
```

## Migration Commands

- `npm run db:migrate` - Create and apply a new migration
- `npm run db:push` - Push schema changes without creating a migration (dev only)
- `npm run db:generate` - Generate Prisma Client
- `npm run db:seed` - Run the seed script
- `npm run db:studio` - Open Prisma Studio to view/edit data

