# Product Requirements Document (PRD)
## Shift & Standby Scheduling System

**Version:** 1.1  
**Last Updated:** November 2024  
**Purpose:** Comprehensive documentation for onboarding developers and preventing regression issues

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [User Interface](#user-interface)
6. [Business Rules](#business-rules)
7. [Key Features](#key-features)
8. [Data Models & Relationships](#data-models--relationships)
9. [Implementation Details](#implementation-details)
10. [Setup & Development](#setup--development)
11. [Testing](#testing)
12. [Deployment](#deployment)

---

## Project Overview

### Purpose
A web application for managing shift schedules for lift engineers across multiple countries (France, UK, Singapore). The system allows operations teams to view schedules, assign engineers to shifts, and manage shift templates and sectors.

### Key Stakeholders
- **Operations Team**: View schedules, assign engineers to shifts
- **Administrators**: Manage sectors, shift templates, and system configuration
- **Engineers**: Assigned to shifts based on availability and sector assignments

### Core Functionality
1. **Schedule Viewing**: Calendar and list views of shifts across sectors and dates
2. **Shift Assignment**: Assign, reassign, and unassign engineers to shifts
3. **Sector Management**: Create, rename, and delete sectors per country
4. **Shift Template Management**: Create and manage shift templates (recurring shift patterns)
5. **Multi-Country Support**: Manage shifts for France, UK, and Singapore with country-specific rules

---

## Architecture

### Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (via Prisma ORM)
- **Caching/State**: SWR (stale-while-revalidate)
- **Authentication**: NextAuth.js (configured but not fully implemented)
- **Distributed Locking**: Redis (Upstash) - for preventing race conditions in shift assignments
- **Validation**: Zod
- **Testing**: Jest (unit/integration), Playwright (E2E)

### Project Structure

```
shiftproto/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── ops/               # Operations schedule page
│   ├── admin/             # Shift Management page
│   ├── payroll/           # Overtime Pay Extract page
│   └── layout.tsx         # Root layout
├── components/             # React components
│   ├── AssignDropdown.tsx # Engineer assignment dropdown
│   └── WeMaintainLogo.tsx # Logo component
├── lib/                    # Shared utilities
│   ├── prisma.ts          # Prisma client singleton
│   ├── redis.ts           # Redis client & locking utilities
│   ├── hooks.ts           # Custom React hooks (useSchedule, useEngineers)
│   ├── api.ts             # API client functions
│   └── zod.ts             # Zod validation schemas
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Development seed script
├── scripts/
│   └── seed-production.ts  # Production seed script
└── __tests__/             # Unit/integration tests
```

### Design System

- **UI Framework**: WeMaintain design system
- **Sidebar**: Dark slate-800 background with white text
- **Main Content**: Light gray background (gray-50)
- **Color Scheme**:
  - Primary: Blue-600
  - Success: Green (onsite shifts)
  - Warning: Yellow (assigned status)
  - Danger: Pink (unassigned shifts requiring action)
  - Info: Blue (remote shifts)

---

## Database Schema

### Core Models

#### Country
- **Purpose**: Represents a country where operations occur
- **Fields**:
  - `code` (PK): ISO country code (FR, GB, SG)
  - `name`: Full country name
  - `timezone`: IANA timezone (e.g., "Europe/Paris")
- **Relationships**: Has many Sectors, Engineers, ShiftTemplates, Shifts, Holidays

#### Sector
- **Purpose**: Geographic or operational division within a country
- **Fields**:
  - `id` (PK): CUID
  - `name`: Sector name (e.g., "Zone Nord-Est", "Drivers", "Walkers")
  - `active`: Boolean flag for soft deletion
  - `countryCode` (FK): References Country
- **Relationships**: 
  - Belongs to Country
  - Has many Shifts
  - Many-to-many with Engineers (via EngineerSectors)

#### Engineer
- **Purpose**: Field engineer who can be assigned to shifts
- **Fields**:
  - `id` (PK): CUID
  - `name`: Engineer full name
  - `active`: Boolean flag for soft deletion
  - `role`: Enum (ADMIN, OPS, ENGINEER)
  - `countryCode` (FK): References Country
  - `createdAt`: Timestamp
- **Relationships**:
  - Belongs to Country
  - Many-to-many with Sectors
  - Has many Assignments

#### ShiftTemplate
- **Purpose**: Reusable template defining shift patterns (e.g., "Weekend Onsite", "Walkers Friday")
- **Fields**:
  - `id` (PK): CUID
  - `name`: Template name
  - `start`: Start time as string (e.g., "08:00")
  - `end`: End time as string (e.g., "20:00")
  - `type`: Enum (ONSITE, REMOTE)
  - `dow`: Array of day abbreviations (["Sat", "Sun", "PH"])
  - `requiredCount`: Number of engineers needed per shift
  - `countryCode` (FK): References Country
  - `active`: Boolean flag for soft deletion (default: true)
  - `deletedAt`: Timestamp when template was deleted (nullable)
  - `createdAt`: Creation timestamp
  - `updatedAt`: Last update timestamp
- **Relationships**: 
  - Belongs to Country
  - Has many Shifts
  - Many-to-many with Sectors (via TemplateSectors relation)

#### Shift
- **Purpose**: Individual shift instance on a specific date
- **Fields**:
  - `id` (PK): CUID
  - `date`: Date bucket (00:00 UTC) - the day this shift occurs
  - `countryCode` (FK): References Country
  - `sectorId` (FK): References Sector
  - `templateId` (FK): References ShiftTemplate
  - `type`: Enum (ONSITE, REMOTE) - copied from template
  - `plannedStart`: Planned start DateTime
  - `plannedEnd`: Planned end DateTime
  - `performedStart`: Actual start DateTime (nullable)
  - `performedEnd`: Actual end DateTime (nullable)
  - `status`: Enum (UNASSIGNED, ASSIGNED, COMPLETED)
  - `updatedBy`: User ID who last updated (nullable)
  - `updatedAt`: Auto-updated timestamp
  - `createdAt`: Creation timestamp
- **Relationships**:
  - Belongs to Country, Sector, ShiftTemplate
  - Has many Assignments

#### Assignment
- **Purpose**: Links an Engineer to a Shift
- **Fields**:
  - `id` (PK): CUID
  - `shiftId` (FK): References Shift
  - `engineerId` (FK): References Engineer
  - `createdAt`: Timestamp
  - `createdBy`: User ID who created (nullable)
- **Constraints**: Unique constraint on (shiftId, engineerId) - prevents duplicate assignments
- **Relationships**: Belongs to Shift and Engineer

#### Holiday
- **Purpose**: Public holidays per country
- **Fields**:
  - `id` (PK): CUID
  - `countryCode` (FK): References Country
  - `date`: Date in UTC (start of day)
  - `label`: Holiday name

### Enums

```typescript
enum Role {
  ADMIN      // System administrator
  OPS        // Operations manager
  ENGINEER   // Field engineer
}

enum ShiftType {
  ONSITE     // On-site shift
  REMOTE     // Remote/standby shift (Astreinte)
}

enum ShiftStatus {
  UNASSIGNED // No engineer assigned
  ASSIGNED   // Engineer assigned but not completed
  COMPLETED  // Shift completed (has performedStart and performedEnd)
}
```

---

## API Endpoints

### Schedule Management

#### `GET /api/schedule`
Get shifts for a country within a date range.

**Query Parameters:**
- `country` (required): Country code (FR, GB, SG)
- `from` (required): Start date (YYYY-MM-DD)
- `to` (required): End date (YYYY-MM-DD)

**Response:**
```json
{
  "shifts": [
    {
      "id": "shift-id",
      "date": "2024-11-15T00:00:00Z",
      "countryCode": "FR",
      "sector": { "id": "...", "name": "Zone Nord-Est" },
      "template": { "id": "...", "name": "Weekend Onsite", ... },
      "plannedStart": "2024-11-15T08:00:00Z",
      "plannedEnd": "2024-11-15T20:00:00Z",
      "performedStart": null,
      "performedEnd": null,
      "status": "ASSIGNED",
      "assignments": [
        {
          "id": "...",
          "engineer": { "id": "...", "name": "Olivier Augendre" }
        }
      ]
    }
  ]
}
```

**Important Notes:**
- Dates are stored in UTC
- `date` field is the day bucket (00:00 UTC)
- `plannedStart` and `plannedEnd` are full DateTime values
- Includes related data: sector, template, assignments with engineer info

### Engineer Management

#### `GET /api/engineers`
Get available engineers for a country and optional sector within a time range.

**Query Parameters:**
- `country` (required): Country code
- `sector` (optional): Sector ID
- `start` (required): Start datetime (ISO format)
- `end` (required): End datetime (ISO format)

**Response:**
```json
{
  "engineers": [
    {
      "id": "engineer-id",
      "name": "Olivier Augendre",
      "active": true,
      "role": "ENGINEER",
      "sectors": [...],
      "assignments": [
        {
          "shift": {
            "id": "...",
            "plannedStart": "...",
            "plannedEnd": "..."
          }
        }
      ]
    }
  ]
}
```

**Business Logic:**
- Only returns active engineers
- Filters by country and optional sector
- Includes assignments that overlap with the requested time range
- Used to check engineer availability and conflicts

### Shift Assignment

#### `POST /api/shifts/:id/assign`
Assign an engineer to a shift.

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
    "id": "assignment-id",
    "shiftId": "shift-id",
    "engineerId": "engineer-id",
    "engineer": { "id": "...", "name": "..." }
  }
}
```

**Important:**
- Uses Redis distributed lock to prevent race conditions
- Updates shift status to ASSIGNED if previously UNASSIGNED
- Returns error if engineer already assigned or has conflicting assignment

#### `POST /api/shifts/:id/reassign`
Reassign a shift to a different engineer.

**Request Body:**
```json
{
  "engineerId": "new-engineer-id"
}
```

**Important:**
- Removes all existing assignments for the shift
- Creates new assignment
- Uses Redis lock

#### `POST /api/shifts/:id/unassign`
Unassign an engineer from a shift.

**Request Body (optional):**
```json
{
  "engineerId": "engineer-id"  // If omitted, unassigns all engineers
}
```

**Important:**
- If no engineerId provided, unassigns all engineers
- Updates shift status to UNASSIGNED if no assignments remain

#### `POST /api/shifts/:id/performed`
Update performed start/end times for a shift.

**Request Body:**
```json
{
  "performedStart": "2024-11-15T08:15:00Z",  // optional
  "performedEnd": "2024-11-15T20:30:00Z"     // optional
}
```

**Business Logic:**
- If both `performedStart` and `performedEnd` are provided, automatically sets status to COMPLETED
- If `performedEnd` is provided and `performedStart` already exists, sets status to COMPLETED

### Sector Management

#### `GET /api/sectors`
List sectors, optionally filtered by country.

**Query Parameters:**
- `country` (optional): Country code filter

**Response:**
```json
{
  "sectors": [
    {
      "id": "sector-id",
      "name": "Zone Nord-Est",
      "active": true,
      "countryCode": "FR",
      "country": { "code": "FR", "name": "France" }
    }
  ]
}
```

#### `POST /api/sectors`
Create a new sector.

**Request Body:**
```json
{
  "name": "New Sector",
  "countryCode": "FR",
  "active": true  // optional, defaults to true
}
```

#### `PUT /api/sectors/:id`
Update a sector (rename or toggle active status).

**Request Body:**
```json
{
  "name": "Updated Name",  // optional
  "active": false          // optional
}
```

#### `DELETE /api/sectors/:id`
Delete a sector.

**Important:** Hard delete - ensure no shifts reference this sector before deleting.

### Shift Template Management

#### `GET /api/shift-templates`
List shift templates, optionally filtered by country.

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
      "countryCode": "FR"
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
  "generateEndDate": "2024-06-30"               // Optional: end date (max 6 months)
}
```

**Validation:**
- `dow` must be a non-empty array
- Valid day abbreviations: Mon, Tue, Wed, Thu, Fri, Sat, Sun, PH (Public Holiday)
- `type` must be ONSITE or REMOTE
- `sectorIds` must be an array of valid sector IDs (if provided)
- `generateEndDate` cannot exceed 6 months from today

**Features:**
- Links template to multiple sectors (many-to-many relationship)
- Optionally auto-generates shifts for the next 6 months when creating template
- Returns `generatedShifts` count if auto-generation occurred

#### `DELETE /api/shift-templates/:id`
Soft delete a shift template.

**Important:** 
- Prevents deletion if future shifts exist (returns error with count)
- Past shifts remain linked via `templateId` for historical data
- Sets `active: false` and `deletedAt` timestamp (soft delete)
- Historical shifts are preserved even after template deletion

#### `POST /api/shifts/generate-from-template`
Manually generate shifts from a template for a date range.

**Request Body:**
```json
{
  "templateId": "template-id",
  "startDate": "2024-01-01",
  "endDate": "2024-06-30",
  "sectorIds": ["sector-id-1"]  // Optional: override template's linked sectors
}
```

**Response:**
```json
{
  "success": true,
  "created": 52,
  "skipped": 0
}
```

**Business Logic:**
- Validates date range (max 6 months)
- Uses template's linked sectors or provided `sectorIds`
- Generates shifts for dates matching template's `dow` (days of week)
- Includes public holidays if template includes "PH" in `dow`
- Skips existing shifts (no duplicates)
- Creates shifts with `UNASSIGNED` status

---

## User Interface

### Pages

#### `/ops` - Operations Schedule Page
**Purpose:** Main schedule viewing and assignment interface

**Features:**
- **Calendar View** (default):
  - Grid layout: Sectors as rows, dates as columns
  - Shows 4 weeks: 2 weeks past, current week, 2 weeks future
  - Week indicator at top showing current week range
  - Sticky sector column for horizontal scrolling
  - **Auto-scroll to today's date** when page loads (centers today's column)
  - **Navigation buttons** (fixed above table, not affected by horizontal scroll):
    - Previous 30 days (left arrow + label)
    - Next 30 days (right arrow + label)
    - Today button (appears when navigating away)
  - **Today's date highlighting**: Light blue background (`bg-blue-50`) applied to entire column (header and all body cells), bold blue text, no border
  - **Warning banner**: Yellow banner at top displays count of unassigned shifts in next 7 days for selected country
  - Shift cards show:
    - **Shift name**: Recurring shift name (or "Shift" if not recurring)
    - **Icons** (top-left corner):
      - Recurring icon: Circular arrow icon for shifts tied to recurring patterns
      - Shift type icon: Onsite (building) or Remote (phone) icon below recurring icon
    - Engineer name (if assigned) - displayed in button with light green background
    - Planned times (always shown, even for unassigned)
    - Performed times (if available)
    - Status badge
    - Assignment button: Shows engineer name (clickable) or "Assign" if unassigned
  - Visual indicators:
    - **Icons**: Small SVG icons replace color coding for shift types
    - Yellow: Assigned status
    - Light green: Completed status
    - Pink dashed border: Unassigned (action required)
    - Light blue column background: Today's date column
  
- **List View**:
  - Table format with all shifts
  - Columns: Date, Sector, Type, Time, Engineer, Status, Actions
  - Filterable and sortable

- **Country Filter**: Toggle between France, UK, Singapore
  - Selected country persists across page navigation (stored in localStorage)
  - Filter height matches legend height for visual consistency
- **View Toggle**: Switch between Calendar and List views
  - Toggle height matches legend height for visual consistency

**Key Components:**
- `AssignDropdown`: Dropdown component for assigning engineers
- Uses SWR for data fetching and cache invalidation

#### `/admin` - Shift Management Page
**Purpose:** Administrative interface for managing sectors and recurring shifts

**Features:**
- **Manage Sectors** (section title uses active verb):
  - Add new sectors (name + country)
  - Rename sectors (click name to edit inline)
  - Delete sectors (with confirmation)
  - Filter by country
  - Country filter height matches legend height

- **Create Shifts** (section title uses active verb):
  - Create recurring shifts or one-shot shifts with:
    - Name
    - Start/End time (time picker)
    - Type (Onsite/Remote dropdown)
    - Days of week (multi-select buttons: Mon-Sun + PH) - for recurring only
    - Number of Engineers (number input)
    - Shift type: Recurring or One-shot (radio buttons)
    - Date range: Start and end dates for recurring, single date for one-shot
    - Sector selection (multi-select buttons - link shift to sectors)
  - Loading state: Spinner and disabled button during creation
  - Success message: Shows count of generated shifts

- **Manage Recurring Shifts** (section title uses active verb):
  - List all recurring shifts with details:
    - Name, time range, type, days of week, engineer count
    - Date range (start to end)
    - Linked sectors
  - **Extend**: Button opens modal to extend end date (within 6 months)
    - Defaults to 6 months from current end date
    - Custom date picker
  - **End**: Button to delete recurring shift (renamed from "Delete")
    - Cascade deletion: Removes all associated shifts and assignments
    - Loading state: Shows "Deleting..." during operation
    - No restriction on future shifts (allows deletion even with future shifts)
  - Filter by country
  - Country filter height matches legend height

**UI Pattern:**
- WeMaintain-style sidebar
- Country filter at top (persists across navigation)
- Three main sections: Manage Sectors, Create Shifts, Manage Recurring Shifts
- Forms for creation, inline editing for sectors
- Modal dialogs for extend functionality
- Consistent button heights matching legend

#### `/payroll` - Overtime Pay Extract Page
**Purpose:** Export completed shifts for payroll and overtime reporting

**Features:**
- **Period Selection**:
  - Default preset: "Last Payroll Month" (22nd of previous month to 21st of current month)
  - Automatically calculates last completed payroll period based on current date
  - Custom date range selection (start and end dates)
  - Country filter (France, United Kingdom, Singapore)
    - Selected country persists across page navigation (stored in localStorage)
    - Filter height matches legend height
  
- **Completed Shifts List**:
  - Table view showing all completed shifts for selected period
  - Columns: Date, Sector, Type, Planned Time, Performed Time, Engineer
  - Same format as list view on operations page
  - Shows shift count and date range
  
- **CSV Export**:
  - Export button generates CSV file with all completed shifts
  - Includes: Date, Sector, Type, Planned Start/End, Performed Start/End, Engineer, Country
  - Filename format: `overtime-pay-extract-{country}-{startDate}-{endDate}.csv`
  - Properly formatted CSV with quoted fields

**Business Logic:**
- Only shows shifts with `status: COMPLETED`
- Filters by selected country and date range
- Last payroll period calculation:
  - If current day >= 22nd: Last completed is previous month (e.g., Nov 22 → Oct 22-Nov 21)
  - If current day < 22nd: Last completed is 2 months ago (e.g., Nov 13 → Sept 22-Oct 21)

### Common UI Patterns

#### Sidebar Navigation
- Dark slate-800 background
- WeMaintain logo at top
- Navigation links:
  - Schedule (links to `/ops`)
  - Shift Management (links to `/admin`)
  - Overtime Pay Extract (links to `/payroll`)
- Active page highlighted with slate-700 background

#### Visual Indicators & Icons
- **Shift Type Icons**: Small SVG icons in top-left corner of shift boxes
  - Onsite: Building icon
  - Remote: Phone/remote icon
- **Recurring Shift Icon**: Circular arrow icon in top-left corner (above shift type icon)
- **Status Badges**:
  - Assigned: Yellow badge
  - Completed: Light green badge
- **Unassigned Shifts**: Pink background (pink-50) with dashed pink border (pink-500)
- **Today's Column**: Light blue background (`bg-blue-50`) for entire column
- **Public Holiday**: Gray background
- **Legend**: Displays icons and indicators with consistent styling

#### Responsive Design
- Horizontal scrolling for calendar grid
- Sticky sector column for navigation
- Mobile-friendly forms and tables

---

## Business Rules

### Shift Assignment Rules

1. **One Engineer Per Shift**: A shift can have multiple assignments, but typically one engineer per shift
2. **Conflict Detection**: Engineers cannot be assigned to overlapping shifts
   - Overlap check: `shift1.plannedStart < shift2.plannedEnd && shift1.plannedEnd > shift2.plannedStart`
3. **Sector Matching**: Engineers must be assigned to sectors they belong to
4. **Country Matching**: Engineers must be from the same country as the shift

### Shift Status Transitions

```
UNASSIGNED → ASSIGNED (when engineer assigned to future shift)
UNASSIGNED → COMPLETED (when engineer assigned to past shift - automatic)
ASSIGNED → COMPLETED (when performedStart and performedEnd both set, or when past shift is assigned)
COMPLETED → (cannot change back)
```

**Important Rules:**
- **Past Shift Assignment**: When assigning an engineer to a shift in the past, the status is automatically set to `COMPLETED` and `performedStart`/`performedEnd` are set to `plannedStart`/`plannedEnd`
- **Future Shift Assignment**: When assigning an engineer to a future shift, status is set to `ASSIGNED`
- **Reassignment**: Same rules apply - reassigning a past shift sets it to COMPLETED

### Country-Specific Rules

#### France
- **Weekend Shifts**: Saturday and Sunday only
- **One Shift Per Day**: Only one shift per sector per weekend day
- **Sectors**: Zone Nord-Est, Zone Sud-Ouest, Zone SNCF 1
- **Public Holidays**: Shifts created for public holidays (e.g., Nov 11th - Armistice Day)

#### United Kingdom
- **Weekend Shifts**: Saturday and Sunday
- **Two Shifts Per Day**: 
  - Day shift: 8am-8pm
  - Night shift: 8pm-8am (spans to next day)
- **Sectors**: Drivers, Walkers
- **Walkers Special Shift**: Friday 5pm-10pm shift for Walkers sector

#### Singapore
- **Weekend Shifts**: Saturday and Sunday
- **One Shift Per Day**: Similar to France pattern

### Date Handling

- **All dates stored in UTC**
- `date` field: Day bucket at 00:00 UTC
- `plannedStart`/`plannedEnd`: Full DateTime values
- **Night Shifts**: End time is next day (e.g., 8pm Nov 15 → 8am Nov 16)

### Shift Template Rules

- **Days of Week**: Array of abbreviations (Mon, Tue, Wed, Thu, Fri, Sat, Sun, PH)
- **PH**: Special value for Public Holidays
- **Time Format**: HH:MM (24-hour format, e.g., "08:00", "20:00")
- **Required Count**: Number of engineers needed per shift instance

---

## Key Features

### 1. Multi-Week Calendar View
- Shows 4 weeks total (2 past, current, 2 future)
- Centered on current date
- Week indicator at top
- Horizontal scrolling with sticky sector column

### 2. Real-Time Assignment
- SWR for data fetching and cache invalidation
- Optimistic updates
- Conflict detection before assignment

### 3. Distributed Locking
- Redis locks prevent race conditions in shift assignments
- Lock key format: `lock:shift:{shiftId}`
- Lock TTL: 10 seconds (configurable)
- Retry mechanism: 10 retries with 100ms delay

### 4. Unassigned Shift Highlighting & Warning System
- Pink dashed border for unassigned shifts
- Always shows planned times (even when unassigned)
- Clear visual indicator requiring action
- **Warning Banner**: Yellow banner displays at top of schedule page when unassigned shifts exist in next 7 days
  - Shows count of unassigned shifts
  - Filters by selected country
  - Accurately checks both `status === 'UNASSIGNED'` and absence of assigned engineer
  - Updates automatically when shifts are assigned/unassigned

### 5. Sector Rotation (France)
- Weekend shifts rotate between sectors
- Saturday: Zone Nord-Est
- Sunday: Zone Sud-Ouest
- Prevents over-assignment to single sector

### 6. Night Shift Support (UK)
- Shifts can span midnight
- End time is next day
- Properly handled in date calculations

### 7. Shift Template to Sector Linking
- Many-to-many relationship between templates and sectors
- Templates can be linked to multiple sectors
- When generating shifts, creates shifts for all linked sectors
- Allows flexible shift pattern management per sector

### 8. Hybrid Shift Generation
- **Auto-generation**: Option to auto-generate shifts for 6 months when creating template
- **Manual generation**: "Generate Shifts" button for existing templates
- **Date range validation**: Maximum 6 months from start date
- **Smart generation**: Respects template's days of week and public holidays
- **Duplicate prevention**: Skips existing shifts

### 9. Soft Deletion for Templates
- Templates marked as `active: false` instead of hard delete
- Prevents deletion if future shifts exist
- Past shifts remain linked for historical data
- `deletedAt` timestamp tracks when template was deleted

### 10. Calendar Navigation
- Previous/Next 30 days navigation
- Auto-scroll to today's date on page load (only on initial load)
- Today's date prominently highlighted with light blue column background
- Fixed navigation buttons above scrollable table

### 11. Country Filter Persistence
- Selected country stored in localStorage
- Persists across page navigation (Ops, Admin, Payroll)
- Automatically syncs on page load
- Prevents hydration mismatches with proper useEffect handling

### 12. Recurring Shift Management Enhancements
- **Extend Functionality**: Modal-based extension with custom date picker (within 6 months)
- **Cascade Deletion**: Deleting recurring shift removes all associated shifts and assignments
- **No Future Shift Restriction**: Allows deletion even when future shifts exist
- **Loading States**: Visual feedback during create/delete operations
- **Section Titles**: Active verb format ("Manage Sectors", "Create Shifts", "Manage Recurring Shifts")

---

## Data Models & Relationships

### Entity Relationship Diagram (Text)

```
Country (1) ──< (many) Sector
Country (1) ──< (many) Engineer
Country (1) ──< (many) ShiftTemplate
Country (1) ──< (many) Shift
Country (1) ──< (many) Holiday

Sector (many) ──< (many) Engineer (via EngineerSectors)
Sector (1) ──< (many) Shift
Sector (many) ──< (many) ShiftTemplate (via TemplateSectors)

ShiftTemplate (1) ──< (many) Shift
ShiftTemplate (many) ──< (many) Sector (via TemplateSectors)

Shift (1) ──< (many) Assignment
Engineer (1) ──< (many) Assignment
```

### Key Relationships

1. **Country → Sectors**: One-to-many (a country has many sectors)
2. **Country → Engineers**: One-to-many (engineers belong to one country)
3. **Sector ↔ Engineers**: Many-to-many (engineers can work in multiple sectors)
4. **ShiftTemplate → Shifts**: One-to-many (template defines pattern, shifts are instances)
5. **ShiftTemplate ↔ Sectors**: Many-to-many (templates can apply to multiple sectors)
6. **Shift → Assignments**: One-to-many (a shift can have multiple assignments, but typically one)
7. **Engineer → Assignments**: One-to-many (engineer can have many shift assignments)

### Cascading Deletes

- **Country deletion**: Would cascade to sectors, engineers, shifts, templates, holidays
- **Sector deletion**: Would cascade to shifts (but shifts should be handled first)
- **Shift deletion**: Would cascade to assignments
- **Engineer deletion**: Would cascade to assignments

**⚠️ Important:** Always check for dependent records before deleting sectors or templates.

---

## Implementation Details

### Prisma Client Singleton

**File:** `lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**Why:** Prevents multiple Prisma Client instances in development (Next.js hot reload)

### Redis Locking

**File:** `lib/redis.ts`

**Functions:**
- `acquireLock(key, ttl, retryDelay, maxRetries)`: Acquire distributed lock
- `releaseLock(key, lockValue)`: Release lock using Lua script

**Usage Pattern:**
```typescript
const lockValue = await acquireLock(`shift:${shiftId}`)
if (!lockValue) {
  throw new Error('Could not acquire lock')
}
try {
  // Perform assignment
} finally {
  await releaseLock(`shift:${shiftId}`, lockValue)
}
```

**Why:** Prevents race conditions when multiple users assign the same shift simultaneously

### SWR Hooks

**File:** `lib/hooks.ts`

**Custom Hooks:**
- `useSchedule(country, from, to)`: Fetch shifts for date range
- `useEngineers(country, start, end, sector?)`: Fetch available engineers

**Pattern:**
- Uses SWR for caching and revalidation
- Returns `{ data, isLoading, isError, mutate }`
- `mutate()` used to invalidate cache after mutations

### API Client Functions

**File:** `lib/api.ts`

**Functions:**
- `assignShift(shiftId, engineerId)`
- `reassignShift(shiftId, engineerId)`
- `unassignShift(shiftId, engineerId?)`
- `updatePerformedTimes(shiftId, performedStart?, performedEnd?)`

**Pattern:**
- All functions return Promise
- Throw errors on failure
- Used by components for API calls

### Component Patterns

#### AssignDropdown Component
**File:** `components/AssignDropdown.tsx`

**Features:**
- Fetches available engineers using `useEngineers` hook
- Filters out engineers with conflicting assignments
- Shows current engineer if assigned
- Handles assign/reassign/unassign actions
- Invalidates SWR cache after mutations

**Props:**
- `shiftId`: Shift ID
- `currentEngineerId`: Currently assigned engineer (optional)
- `countryCode`: Country code
- `sectorId`: Sector ID
- `plannedStart`: Shift start time (ISO string)
- `plannedEnd`: Shift end time (ISO string)
- `onAssign`: Callback after assignment

### Date Handling Patterns

**Important Conventions:**
1. **Day Buckets**: `date` field is always 00:00 UTC of the day
2. **Time Storage**: `plannedStart`/`plannedEnd` are full DateTime values
3. **Night Shifts**: End time is next day (e.g., 8pm Nov 15 → 8am Nov 16)
4. **Display**: Convert to local timezone for display
5. **API**: Accept ISO strings, return ISO strings

### Error Handling

**API Routes:**
- Try-catch blocks around all database operations
- Return appropriate HTTP status codes
- Log errors to console (consider proper logging in production)
- Return user-friendly error messages

**Frontend:**
- SWR handles loading and error states
- Components show error messages
- Form validation using HTML5 and Zod

---

## Setup & Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- PostgreSQL database (local or Neon/Upstash)
- Redis (optional for local dev, required for production)

### Initial Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create `.env.local`:
   ```env
   DATABASE_URL=postgresql://user:password@host:5432/dbname
   REDIS_URL=redis://default:password@host:6379  # Optional for dev
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-here
   ```

3. **Database Setup**
   ```bash
   # Generate Prisma Client
   npm run db:generate
   
   # Push schema (dev) or migrate (production)
   npm run db:push        # Dev: bypasses migrations
   # OR
   npm run db:migrate     # Production: creates migrations
   
   # Seed database
   npm run db:seed:prod   # Production seed data
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint
- `npm test`: Run Jest tests
- `npm run test:e2e`: Run Playwright E2E tests
- `npm run db:generate`: Generate Prisma Client
- `npm run db:push`: Push schema changes (dev only)
- `npm run db:migrate`: Create and apply migrations
- `npm run db:seed`: Seed with development data
- `npm run db:seed:prod`: Seed with production data
- `npm run db:studio`: Open Prisma Studio

### Development Workflow

1. **Schema Changes**: Edit `prisma/schema.prisma`, then run `npm run db:push`
2. **API Changes**: Edit files in `app/api/`
3. **UI Changes**: Edit files in `app/` or `components/`
4. **Testing**: Write tests in `__tests__/` or `e2e/`

### Hot Reload

- Next.js App Router supports hot reload
- Prisma Client regenerates on schema changes (via postinstall script)
- SWR automatically refetches on window focus

---

## Testing

### Unit/Integration Tests (Jest)

**Location:** `__tests__/api/`

**Test Files:**
- `engineers.test.ts`: Engineer API endpoint tests
- `schedule.test.ts`: Schedule API endpoint tests
- `shifts.assign.test.ts`: Shift assignment endpoint tests

**Setup:** `__tests__/setup/prisma.ts` provides test database utilities

**Running Tests:**
```bash
npm test              # All tests
npm run test:watch    # Watch mode
npm run test:api      # API tests only
```

### E2E Tests (Playwright)

**Location:** `e2e/`

**Test Files:**
- `assign.spec.ts`: Shift assignment flow
- `swap.spec.ts`: Reassign/unassign flow
- `payroll-export.spec.ts`: Payroll export flow

**Running Tests:**
```bash
npm run test:e2e           # Headless
npm run test:e2e:ui        # With UI
npm run test:e2e:debug     # Debug mode
```

**Configuration:** `playwright.config.ts`

---

## Deployment

### Production Deployment (Vercel)

**See:** `RUN_DEPLOYMENT.md` for detailed instructions

**Quick Steps:**
1. Set up Neon PostgreSQL database
2. Set up Upstash Redis
3. Configure environment variables in Vercel
4. Deploy: `vercel --prod`
5. Seed production database: `npm run db:seed:prod`

### Environment Variables (Production)

Required:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `REDIS_URL`: Upstash Redis connection string
- `NEXTAUTH_URL`: Production URL (e.g., https://your-app.vercel.app)
- `NEXTAUTH_SECRET`: Random secret (generate with `openssl rand -base64 32`)

### Build Configuration

**File:** `vercel.json`
- Build command: `npm run build`
- Framework: Next.js
- Region: `iad1` (Washington, D.C.)

**Important:** `postinstall` script runs `prisma generate` automatically

### Database Migrations

**Production:** Use `prisma migrate deploy` (not `migrate dev`)
- `migrate dev` is interactive and not suitable for CI/CD
- `migrate deploy` applies existing migrations

---

## Important Notes for Developers

### ⚠️ Critical Patterns

1. **Always use Prisma Client singleton** (`lib/prisma.ts`)
2. **Use Redis locks for shift assignments** to prevent race conditions
3. **Invalidate SWR cache after mutations** using `mutate()`
4. **Check for dependent records before deleting** sectors or templates
5. **Store all dates in UTC**, convert for display only

### Common Pitfalls

1. **Creating multiple Prisma Clients**: Use singleton pattern
2. **Race conditions in assignments**: Always use Redis locks
3. **Stale cache**: Remember to call `mutate()` after mutations
4. **Date timezone issues**: Always work in UTC, convert for display
5. **Hard deletes**: Check dependencies before deleting sectors/templates

### Code Style

- **TypeScript**: Strict mode enabled
- **Components**: Use 'use client' directive for client components
- **API Routes**: Use Next.js Route Handlers (not Pages API)
- **Styling**: Tailwind CSS utility classes
- **State Management**: SWR for server state, React useState for local state

### Future Considerations

1. **Authentication**: NextAuth.js is configured but not fully implemented
2. **Authorization**: Role-based access control (ADMIN, OPS, ENGINEER)
3. **Audit Logging**: Track who made changes (updatedBy, createdBy fields exist)
4. **Notifications**: Alert users when shifts are assigned/unassigned
5. **Bulk Operations**: Assign multiple shifts at once
6. **Shift Templates**: Auto-generate shifts from templates
7. **Reporting**: Payroll export, overtime calculations

---

## Seed Data Reference

### Production Seed (`scripts/seed-production.ts`)

**Countries:**
- France (FR)
- United Kingdom (GB)
- Singapore (SG)

**France Sectors:**
- Zone Nord-Est
- Zone Sud-Ouest
- Zone SNCF 1

**UK Sectors:**
- Drivers
- Walkers

**Singapore Sectors:**
- Singapore Central

**France Engineers:**
- Olivier Augendre (Zone Nord-Est)
- Mathieu Viollet (Zone Sud-Ouest)
- Olivier Rosette
- Mohamed Y

**UK Engineers:**
- Michael Burns (Drivers)
- Clark Walters (Drivers)
- Miguel Castillo (Drivers)
- Lewis Saville (Walkers)

**Singapore Engineers:**
- Wan Iskandar
- Mohd Amirul
- Daryll Kang
- Budi Yohan

**Shift Patterns:**
- **France**: 
  - Weekend shifts (Sat/Sun) - both Zone Nord-Est and Zone Sud-Ouest get shifts on both days
  - Public holidays (e.g., Nov 11th - Armistice Day)
  - Past shifts are REMOTE type, future shifts are ONSITE type
- **UK**: 
  - Weekend shifts (Sat/Sun), two per day (day 8am-8pm + night 8pm-8am)
  - Walkers Friday shift removed (weekends only)
  - Past shifts are REMOTE type
- **Singapore**: 
  - Weekend shifts (Sat/Sun), one per day
  - Past shifts are REMOTE type

**Time Range:** 4 weeks (2 weeks past, current week, 2 weeks future)
- Past shifts: Assigned and COMPLETED
- Future shifts: Some ASSIGNED, most UNASSIGNED

---

## Glossary

- **Shift**: A single work period on a specific date
- **Shift Template**: Reusable pattern defining shift characteristics
- **Sector**: Geographic or operational division within a country
- **Assignment**: Link between an Engineer and a Shift
- **Day Bucket**: Date field stored as 00:00 UTC of the day
- **Astreinte**: French term for remote/standby shift
- **DOW**: Day of Week (Mon, Tue, Wed, Thu, Fri, Sat, Sun, PH)

---

## Support & Contact

For questions or issues:
1. Check this PRD first
2. Review code comments
3. Check test files for usage examples
4. Review API endpoint implementations

---

**Document Version:** 1.1  
**Last Updated:** November 2024  
**Maintained By:** Development Team

## Changelog

### Version 1.1 (November 2024)
- Added icon-based shift type indicators (onsite/remote)
- Added recurring shift icon indicator
- Improved current day highlighting (light blue column background)
- Added warning banner for unassigned shifts in next 7 days
- Implemented country filter persistence across pages
- Updated section titles to use active verbs
- Improved assignment logic for past shifts (auto-complete)
- Enhanced recurring shift deletion (cascade deletion)
- Added loading states for shift operations
- Improved button height consistency across pages

