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

## API Endpoints

### GET /api/schedule

Get schedule for a country within a date range.

**Query Parameters:**
- `country` (required): Country code (e.g., "FR", "US")
- `from` (required): Start date in YYYY-MM-DD format
- `to` (required): End date in YYYY-MM-DD format

**Example:**
```
GET /api/schedule?country=FR&from=2024-01-01&to=2024-01-31
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "shift-id",
      "date": "2024-01-15",
      "country": { "code": "FR", "name": "France", "timezone": "Europe/Paris" },
      "sector": { "id": "sector-id", "name": "Healthcare", "active": true },
      "template": { "id": "template-id", "name": "Weekday", ... },
      "performed": false,
      "assignments": [...]
    }
  ],
  "meta": { "country": "FR", "from": "2024-01-01", "to": "2024-01-31", "count": 10 }
}
```

### GET /api/engineers

Get engineers filtered by country, sector, and time range.

**Query Parameters:**
- `country` (required): Country code
- `sector` (optional): Sector ID
- `start` (required): Start datetime in ISO format
- `end` (required): End datetime in ISO format

**Example:**
```
GET /api/engineers?country=FR&sector=fr-ne&start=2024-01-01T00:00:00Z&end=2024-01-31T23:59:59Z
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "engineer-id",
      "name": "John Doe",
      "role": "ENGINEER",
      "active": true,
      "country": { "code": "FR", "name": "France", "timezone": "Europe/Paris" },
      "sectors": [...],
      "assignments": [...]
    }
  ],
  "meta": { "country": "FR", "sector": "fr-ne", "start": "...", "end": "...", "count": 5 }
}
```

### POST /api/shifts/:id/assign

Assign an engineer to a shift. Uses Redis lock to prevent concurrent assignments.

**Request Body:**
```json
{
  "engineerId": "engineer-id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "assignment-id",
    "engineer": { "id": "...", "name": "...", "role": "...", "active": true },
    "shift": { "id": "...", "date": "...", "sector": {...}, "template": {...}, "performed": false },
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

### POST /api/shifts/:id/unassign

Unassign an engineer from a shift.

**Request Body:**
```json
{
  "engineerId": "engineer-id"
}
```

### POST /api/shifts/:id/reassign

Reassign a shift from one engineer to another. Uses Redis lock.

**Request Body:**
```json
{
  "engineerId": "new-engineer-id",
  "fromEngineerId": "old-engineer-id"
}
```

### POST /api/shifts/:id/performed

Mark a shift as performed or not performed.

**Request Body:**
```json
{
  "performed": true
}
```

## Redis Setup

The application uses Redis for distributed locking on shift assignment operations. Make sure Redis is running and configure the `REDIS_URL` environment variable.

**Default:** `redis://localhost:6379`
