# Shift Management App

A Next.js application for managing shifts for lift engineers on the field.

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Prisma** (PostgreSQL)
- **NextAuth**
- **SWR**
- **Zod**
- **Redis** (ioredis) - For distributed locking

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables:
```bash
cp .env.example .env
```

Edit `.env` and add your:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string (optional for development, required for production)
- `NEXTAUTH_URL` - Your app URL (e.g., http://localhost:3000)
- `NEXTAUTH_SECRET` - A random secret string

3. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Seed the database with mock data
npm run db:seed
```

Alternatively, for quick development without migrations:
```bash
npm run db:push  # Push schema directly (dev only)
npm run db:seed  # Seed the database
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Pages

- `/` - Home page
- `/ops` - Operations schedule dashboard (calendar and list views)
- `/admin` - Shift Management (sectors and recurring shifts)
- `/payroll` - Overtime Pay Extract (completed shifts export)

## Recent Updates (November 2024)

### UI/UX Improvements
- **Icon-based shift indicators**: Replaced color coding with small icons (onsite/remote) in shift boxes
- **Recurring shift indicator**: Icon displayed in top-left corner for shifts tied to recurring patterns
- **Current day highlighting**: Light blue background (`bg-blue-50`) applied to entire column (header and cells) instead of border
- **Warning system**: Yellow banner displays when unassigned shifts exist in the next 7 days for selected country
- **Country filter persistence**: Selected country persists across page navigation using localStorage
- **Consistent button heights**: Filter and toggle buttons match legend height for visual consistency
- **Section titles**: Updated to use active verbs (e.g., "Manage Sectors", "Create Shifts", "Manage Recurring Shifts")

### Functionality Enhancements
- **Improved assignment logic**: Assigning past shifts automatically marks them as COMPLETED
- **Recurring shift deletion**: Cascade deletion removes all associated shifts and assignments when deleting recurring shifts
- **Extend functionality**: Generic "Extend" button with modal to specify custom end date (within 6 months)
- **Loading states**: Visual feedback (spinners) for shift creation and deletion operations
- **Warning accuracy**: Warning count syncs with actual unassigned shifts by checking both status and assignment presence

## Database

### Available Scripts

- `npm run db:generate` - Generate Prisma Client
- `npm run db:migrate` - Create and apply migrations
- `npm run db:push` - Push schema changes (dev only, no migration)
- `npm run db:seed` - Seed database with mock data
- `npm run db:studio` - Open Prisma Studio to view/edit data

### Seed Data

The production seed script (`scripts/seed-production.ts`) creates:
- 3 countries (France, United Kingdom, Singapore)
- Multiple holidays for each country (including Nov 11th for France)
- Sectors:
  - France: Zone Nord-Est, Zone Sud-Ouest, Zone SNCF 1
  - UK: Drivers, Walkers
  - Singapore: Singapore Central
- Engineers per country:
  - France: Olivier Augendre, Mathieu Viollet, Olivier Rosette, Mohamed Y
  - UK: Michael Burns, Clark Walters, Miguel Castillo, Lewis Saville
  - Singapore: Wan Iskandar, Mohd Amirul, Daryll Kang, Budi Yohan
- Shift templates for weekend and public holiday patterns
- 4 weeks of shifts (2 weeks past, current week, 2 weeks future)
- Past shifts are marked as COMPLETED with REMOTE type
- Future shifts are UNASSIGNED or ASSIGNED

See `scripts/seed-production.ts` for production seed details, or `prisma/seed.ts` for development seed.

## Testing

### API Tests (Jest + Supertest)

Run API tests:
```bash
npm test              # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:api       # Run only API tests
```

API tests are located in `__tests__/api/` and test:
- Schedule endpoint (`/api/schedule`)
- Engineers endpoint (`/api/engineers`)
- Shift assignment endpoints (`/api/shifts/:id/assign`, `/reassign`, `/unassign`)

### E2E Tests (Playwright)

Run E2E tests:
```bash
npm run test:e2e           # Run all E2E tests
npm run test:e2e:ui         # Run with Playwright UI
npm run test:e2e:debug      # Run in debug mode
```

E2E tests are located in `e2e/` and cover:
- **Assign Flow** (`e2e/assign.spec.ts`) - Assigning engineers to shifts
- **Swap/Reassign Flow** (`e2e/swap.spec.ts`) - Reassigning and unassigning engineers
- **Payroll Export Flow** (`e2e/payroll-export.spec.ts`) - Payroll export functionality

### Test Setup

For API tests, ensure you have:
- `TEST_DATABASE_URL` environment variable set (or use `DATABASE_URL`)
- Test database is accessible

For E2E tests:
- The dev server will start automatically
- Tests run against `http://localhost:3000` by default
- Set `PLAYWRIGHT_TEST_BASE_URL` to override

## API Endpoints

### GET /api/schedule
Get shifts for a country within a date range.

**Query Parameters:**
- `country` (required): Country code (e.g., "FR", "GB")
- `from` (required): Start date in YYYY-MM-DD format
- `to` (required): End date in YYYY-MM-DD format

**Example:**
```
GET /api/schedule?country=FR&from=2024-01-01&to=2024-01-31
```

**Response:**
```json
{
  "shifts": [
    {
      "id": "...",
      "date": "2024-01-01T00:00:00Z",
      "countryCode": "FR",
      "sector": { "id": "...", "name": "Paris North" },
      "template": { "id": "...", "name": "Weekend Onsite", ... },
      "plannedStart": "2024-01-01T08:00:00Z",
      "plannedEnd": "2024-01-01T20:00:00Z",
      "status": "ASSIGNED",
      "assignments": [...]
    }
  ]
}
```

### GET /api/engineers
Get available engineers for a country and optional sector within a time range.

**Query Parameters:**
- `country` (required): Country code (e.g., "FR", "GB")
- `sector` (optional): Sector ID
- `start` (required): Start datetime in ISO format
- `end` (required): End datetime in ISO format

**Example:**
```
GET /api/engineers?country=FR&sector=fr-ne&start=2024-01-01T08:00:00Z&end=2024-01-01T20:00:00Z
```

**Response:**
```json
{
  "engineers": [
    {
      "id": "...",
      "name": "Jean Dupont",
      "active": true,
      "role": "ENGINEER",
      "sectors": [...],
      "assignments": [...]
    }
  ]
}
```

### POST /api/shifts/:id/assign
Assign an engineer to a shift. Uses Redis lock to prevent race conditions.

**Request Body:**
```json
{
  "engineerId": "engineer-id"
}
```

**Response:**
```json
{
  "assignment": {
    "id": "...",
    "shiftId": "...",
    "engineerId": "...",
    "engineer": { "id": "...", "name": "..." }
  }
}
```

### POST /api/shifts/:id/unassign
Unassign an engineer from a shift.

**Request Body (optional):**
```json
{
  "engineerId": "engineer-id"  // If omitted, unassigns all engineers
}
```

### POST /api/shifts/:id/reassign
Reassign a shift to a different engineer. Removes all existing assignments and creates a new one. Uses Redis lock.

**Request Body:**
```json
{
  "engineerId": "engineer-id"
}
```

### POST /api/shifts/:id/performed
Update performed start/end times for a shift.

**Request Body:**
```json
{
  "performedStart": "2024-01-01T08:15:00Z",  // optional
  "performedEnd": "2024-01-01T20:30:00Z"     // optional
}
```

**Note:** If both `performedStart` and `performedEnd` are provided (or `performedEnd` is provided and `performedStart` already exists), the shift status is automatically set to `COMPLETED`.

### Shift Template Management

#### `GET /api/shift-templates`
List active shift templates, optionally filtered by country. Includes linked sectors.

**Query Parameters:**
- `country` (optional): Country code filter

**Response:**
```json
{
  "templates": [
    {
      "id": "template-id",
      "name": "Weekend Onsite",
      "start": "08:00",
      "end": "20:00",
      "type": "ONSITE",
      "dow": ["Sat", "Sun"],
      "requiredCount": 1,
      "countryCode": "FR",
      "sectors": [
        { "id": "...", "name": "Zone Nord-Est" },
        { "id": "...", "name": "Zone Sud-Ouest" }
      ]
    }
  ]
}
```

#### `POST /api/shift-templates`
Create a new shift template with optional sector linking and auto-generation.

**Request Body:**
```json
{
  "name": "Weekend Onsite",
  "start": "08:00",
  "end": "20:00",
  "type": "ONSITE",
  "dow": ["Sat", "Sun", "PH"],
  "requiredCount": 1,
  "countryCode": "FR",
  "sectorIds": ["sector-id-1", "sector-id-2"],  // Optional: link to sectors
  "autoGenerate": true,                          // Optional: auto-generate shifts
  "generateEndDate": "2024-06-30"               // Optional: end date for generation (max 6 months)
}
```

**Features:**
- Links template to multiple sectors (many-to-many relationship)
- Optionally auto-generates shifts for the next 6 months
- Validates date range (max 6 months from today)

#### `DELETE /api/shift-templates/:id`
Soft delete a shift template (marks as inactive).

**Important:** 
- Prevents deletion if future shifts exist
- Past shifts remain linked for historical data
- Sets `active: false` and `deletedAt` timestamp

#### `POST /api/shifts/generate-from-template`
Manually generate shifts from a template for a date range.

**Request Body:**
```json
{
  "templateId": "template-id",
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "sectorIds": ["sector-id-1"]  // Optional: override template's sectors
}
```

**Features:**
- Generates shifts for specified date range (max 6 months)
- Respects template's days of week (dow) and public holidays
- Skips existing shifts (no duplicates)
- Returns count of created shifts

### Sector Management

#### `GET /api/sectors`
List sectors, optionally filtered by country.

**Query Parameters:**
- `country` (optional): Country code filter

#### `POST /api/sectors`
Create a new sector.

#### `PUT /api/sectors/:id`
Update a sector (rename or toggle active status).

#### `DELETE /api/sectors/:id`
Delete a sector (hard delete - ensure no shifts reference it).

