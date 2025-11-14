/**
 * Production seed script
 * Run this after deploying to seed the production database
 * 
 * Usage:
 *   DATABASE_URL="your-neon-connection-string" ts-node scripts/seed-production.ts
 */

import { PrismaClient, ShiftType, ShiftStatus } from '@prisma/client'
import { generateShiftsFromRecurring } from '../lib/recurring-shift-generator'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding production database...')
  console.log('⚠️  WARNING: This will clear existing data!')

  // Check if we're in production
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  // Safety check - require explicit confirmation in production
  if (process.env.NODE_ENV === 'production' && !process.env.FORCE_SEED) {
    console.error('❌ Production seed requires FORCE_SEED=true')
    console.error('   Set FORCE_SEED=true to confirm you want to seed production')
    process.exit(1)
  }

  try {
    // Clear existing data (be careful in production!)
    console.log('🧹 Cleaning existing data...')
    await prisma.assignment.deleteMany()
    await prisma.shift.deleteMany()
    await prisma.recurringShift.deleteMany()
    await prisma.engineer.deleteMany()
    await prisma.sector.deleteMany()
    await prisma.holiday.deleteMany()
    await prisma.country.deleteMany()

    // Create Countries
    const france = await prisma.country.create({
      data: {
        code: 'FR',
        name: 'France',
        timezone: 'Europe/Paris',
      },
    })

    const uk = await prisma.country.create({
      data: {
        code: 'GB',
        name: 'United Kingdom',
        timezone: 'Europe/London',
      },
    })

    const singapore = await prisma.country.create({
      data: {
        code: 'SG',
        name: 'Singapore',
        timezone: 'Asia/Singapore',
      },
    })

    console.log('✅ Created countries')

    // Create Holidays - Generate for multiple years (2024-2026) to cover 6-month shift generation
    const holidays: Array<{ countryCode: string; date: Date; label: string }> = []
    
    // Helper function to add holidays for multiple years
    const addHolidaysForYears = (
      countryCode: string,
      month: number, // 0-indexed (0 = January)
      day: number,
      label: string,
      years: number[] = [2024, 2025, 2026]
    ) => {
      years.forEach(year => {
        holidays.push({
          countryCode,
          date: new Date(Date.UTC(year, month, day, 0, 0, 0, 0)),
          label: `${label} ${year}`,
        })
      })
    }

    // France holidays (11 public holidays)
    // Fixed date holidays
    addHolidaysForYears('FR', 0, 1, 'New Year\'s Day') // January 1
    addHolidaysForYears('FR', 4, 1, 'Labour Day') // May 1
    addHolidaysForYears('FR', 6, 14, 'Bastille Day') // July 14
    addHolidaysForYears('FR', 7, 15, 'Assumption Day') // August 15
    addHolidaysForYears('FR', 10, 1, 'All Saints\' Day') // November 1
    addHolidaysForYears('FR', 10, 11, 'Armistice Day') // November 11
    addHolidaysForYears('FR', 11, 25, 'Christmas Day') // December 25
    
    // Easter-based holidays (calculated for 2024-2026)
    // Easter Sunday dates: 2024-03-31, 2025-04-20, 2026-04-05
    // Easter Monday: day after Easter Sunday
    // Ascension Day: 39 days after Easter Sunday
    // Whit Monday: 50 days after Easter Sunday
    const easterDates = [
      { year: 2024, easter: new Date(Date.UTC(2024, 2, 31, 0, 0, 0, 0)) }, // March 31
      { year: 2025, easter: new Date(Date.UTC(2025, 3, 20, 0, 0, 0, 0)) }, // April 20
      { year: 2026, easter: new Date(Date.UTC(2026, 3, 5, 0, 0, 0, 0)) },  // April 5
    ]
    
    easterDates.forEach(({ year, easter }) => {
      // Easter Monday (day after Easter)
      const easterMonday = new Date(easter)
      easterMonday.setUTCDate(easter.getUTCDate() + 1)
      holidays.push({ countryCode: 'FR', date: easterMonday, label: `Easter Monday ${year}` })
      
      // Ascension Day (39 days after Easter)
      const ascension = new Date(easter)
      ascension.setUTCDate(easter.getUTCDate() + 39)
      holidays.push({ countryCode: 'FR', date: ascension, label: `Ascension Day ${year}` })
      
      // Whit Monday (50 days after Easter)
      const whitMonday = new Date(easter)
      whitMonday.setUTCDate(easter.getUTCDate() + 50)
      holidays.push({ countryCode: 'FR', date: whitMonday, label: `Whit Monday ${year}` })
    })

    // United Kingdom holidays
    // Fixed date holidays
    addHolidaysForYears('GB', 0, 1, 'New Year\'s Day')
    addHolidaysForYears('GB', 11, 25, 'Christmas Day')
    addHolidaysForYears('GB', 11, 26, 'Boxing Day')
    
    // UK Easter-based holidays
    easterDates.forEach(({ year, easter }) => {
      // Good Friday (2 days before Easter)
      const goodFriday = new Date(easter)
      goodFriday.setUTCDate(easter.getUTCDate() - 2)
      holidays.push({ countryCode: 'GB', date: goodFriday, label: `Good Friday ${year}` })
      
      // Easter Monday
      const easterMonday = new Date(easter)
      easterMonday.setUTCDate(easter.getUTCDate() + 1)
      holidays.push({ countryCode: 'GB', date: easterMonday, label: `Easter Monday ${year}` })
    })
    
    // Early May Bank Holiday (first Monday in May)
    holidays.push({ countryCode: 'GB', date: new Date(Date.UTC(2024, 4, 6, 0, 0, 0, 0)), label: 'Early May Bank Holiday 2024' })
    holidays.push({ countryCode: 'GB', date: new Date(Date.UTC(2025, 4, 5, 0, 0, 0, 0)), label: 'Early May Bank Holiday 2025' })
    holidays.push({ countryCode: 'GB', date: new Date(Date.UTC(2026, 4, 4, 0, 0, 0, 0)), label: 'Early May Bank Holiday 2026' })
    
    // Spring Bank Holiday (last Monday in May)
    holidays.push({ countryCode: 'GB', date: new Date(Date.UTC(2024, 4, 27, 0, 0, 0, 0)), label: 'Spring Bank Holiday 2024' })
    holidays.push({ countryCode: 'GB', date: new Date(Date.UTC(2025, 4, 26, 0, 0, 0, 0)), label: 'Spring Bank Holiday 2025' })
    holidays.push({ countryCode: 'GB', date: new Date(Date.UTC(2026, 4, 25, 0, 0, 0, 0)), label: 'Spring Bank Holiday 2026' })
    
    // Summer Bank Holiday (last Monday in August)
    holidays.push({ countryCode: 'GB', date: new Date(Date.UTC(2024, 7, 26, 0, 0, 0, 0)), label: 'Summer Bank Holiday 2024' })
    holidays.push({ countryCode: 'GB', date: new Date(Date.UTC(2025, 7, 25, 0, 0, 0, 0)), label: 'Summer Bank Holiday 2025' })
    holidays.push({ countryCode: 'GB', date: new Date(Date.UTC(2026, 7, 31, 0, 0, 0, 0)), label: 'Summer Bank Holiday 2026' })

    // Singapore holidays
    // Fixed date holidays
    addHolidaysForYears('SG', 0, 1, 'New Year\'s Day')
    addHolidaysForYears('SG', 7, 9, 'National Day') // August 9
    addHolidaysForYears('SG', 11, 25, 'Christmas Day')
    
    // Chinese New Year (varies by year)
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2024, 1, 10, 0, 0, 0, 0)), label: 'Chinese New Year 2024' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2024, 1, 11, 0, 0, 0, 0)), label: 'Chinese New Year Day 2 2024' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2025, 0, 29, 0, 0, 0, 0)), label: 'Chinese New Year 2025' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2025, 0, 30, 0, 0, 0, 0)), label: 'Chinese New Year Day 2 2025' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2026, 1, 17, 0, 0, 0, 0)), label: 'Chinese New Year 2026' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2026, 1, 18, 0, 0, 0, 0)), label: 'Chinese New Year Day 2 2026' })
    
    // Good Friday (same as UK)
    easterDates.forEach(({ year, easter }) => {
      const goodFriday = new Date(easter)
      goodFriday.setUTCDate(easter.getUTCDate() - 2)
      holidays.push({ countryCode: 'SG', date: goodFriday, label: `Good Friday ${year}` })
    })
    
    // Labour Day
    addHolidaysForYears('SG', 4, 1, 'Labour Day')
    
    // Vesak Day (varies by year, approximate dates)
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2024, 4, 22, 0, 0, 0, 0)), label: 'Vesak Day 2024' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2025, 4, 12, 0, 0, 0, 0)), label: 'Vesak Day 2025' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2026, 4, 31, 0, 0, 0, 0)), label: 'Vesak Day 2026' })
    
    // Hari Raya Puasa (varies by year, approximate dates)
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2024, 3, 10, 0, 0, 0, 0)), label: 'Hari Raya Puasa 2024' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2025, 2, 31, 0, 0, 0, 0)), label: 'Hari Raya Puasa 2025' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2026, 2, 20, 0, 0, 0, 0)), label: 'Hari Raya Puasa 2026' })
    
    // Hari Raya Haji (varies by year, approximate dates)
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2024, 5, 16, 0, 0, 0, 0)), label: 'Hari Raya Haji 2024' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2025, 5, 6, 0, 0, 0, 0)), label: 'Hari Raya Haji 2025' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2026, 4, 26, 0, 0, 0, 0)), label: 'Hari Raya Haji 2026' })
    
    // Deepavali (varies by year, approximate dates)
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2024, 10, 1, 0, 0, 0, 0)), label: 'Deepavali 2024' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2025, 10, 20, 0, 0, 0, 0)), label: 'Deepavali 2025' })
    holidays.push({ countryCode: 'SG', date: new Date(Date.UTC(2026, 10, 8, 0, 0, 0, 0)), label: 'Deepavali 2026' })

    for (const holiday of holidays) {
      await prisma.holiday.create({ data: holiday })
    }

    console.log('✅ Created holidays')

    // Create Sectors
    // France
    const zoneNordNordEst = await prisma.sector.create({
      data: {
        name: 'Zone Nord Nord/Est',
        active: true,
        countryCode: 'FR',
      },
    })

    const zoneSudOuest = await prisma.sector.create({
      data: {
        name: 'Zone Sud/Ouest',
        active: true,
        countryCode: 'FR',
      },
    })

    const sncf = await prisma.sector.create({
      data: {
        name: 'SNCF',
        active: true,
        countryCode: 'FR',
      },
    })

    const drivers = await prisma.sector.create({
      data: {
        name: 'Drivers',
        active: true,
        countryCode: 'GB',
      },
    })

    const walkers = await prisma.sector.create({
      data: {
        name: 'Walkers',
        active: true,
        countryCode: 'GB',
      },
    })

    // Singapore
    const eastNorthArea = await prisma.sector.create({
      data: {
        name: 'East/North area',
        active: true,
        countryCode: 'SG',
      },
    })

    const westCentralArea = await prisma.sector.create({
      data: {
        name: 'West/Central area',
        active: true,
        countryCode: 'SG',
      },
    })

    const businessCenterDistrict = await prisma.sector.create({
      data: {
        name: 'Business Center district',
        active: true,
        countryCode: 'SG',
      },
    })

    console.log('✅ Created sectors')

    // Create Engineers
    const engineers = [
      // France Engineers
      {
        name: 'Franck Fauvarque',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'FR',
        sectors: { connect: [{ id: zoneNordNordEst.id }, { id: zoneSudOuest.id }, { id: sncf.id }] },
      },
      {
        name: 'Gildas Ndinga',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'FR',
        sectors: { connect: [{ id: zoneNordNordEst.id }, { id: zoneSudOuest.id }, { id: sncf.id }] },
      },
      {
        name: 'Olivier augendre',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'FR',
        sectors: { connect: [{ id: zoneNordNordEst.id }, { id: zoneSudOuest.id }, { id: sncf.id }] },
      },
      {
        name: 'Julien Panchèvre',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'FR',
        sectors: { connect: [{ id: zoneNordNordEst.id }, { id: zoneSudOuest.id }, { id: sncf.id }] },
      },
      {
        name: 'Amine Ourchid',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'FR',
        sectors: { connect: [{ id: zoneNordNordEst.id }, { id: zoneSudOuest.id }, { id: sncf.id }] },
      },
      // UK Engineers
      {
        name: 'Daniel Fingelton',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'GB',
        sectors: { connect: [{ id: drivers.id }, { id: walkers.id }] },
      },
      {
        name: 'Kari Onuma',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'GB',
        sectors: { connect: [{ id: drivers.id }, { id: walkers.id }] },
      },
      {
        name: 'James Dalton',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'GB',
        sectors: { connect: [{ id: drivers.id }, { id: walkers.id }] },
      },
      {
        name: 'Dan Jennings',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'GB',
        sectors: { connect: [{ id: drivers.id }, { id: walkers.id }] },
      },
      {
        name: 'Callum Neil',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'GB',
        sectors: { connect: [{ id: drivers.id }, { id: walkers.id }] },
      },
      {
        name: 'Lewis Hughes',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'GB',
        sectors: { connect: [{ id: drivers.id }, { id: walkers.id }] },
      },
      // Singapore Engineers
      {
        name: 'Wan Iskandar',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'SG',
        sectors: { connect: [{ id: eastNorthArea.id }, { id: westCentralArea.id }, { id: businessCenterDistrict.id }] },
      },
      {
        name: 'Budi Yohan',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'SG',
        sectors: { connect: [{ id: eastNorthArea.id }, { id: westCentralArea.id }, { id: businessCenterDistrict.id }] },
      },
      {
        name: 'Mohd Amirul',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'SG',
        sectors: { connect: [{ id: eastNorthArea.id }, { id: westCentralArea.id }, { id: businessCenterDistrict.id }] },
      },
      {
        name: 'Faaliq Amran',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'SG',
        sectors: { connect: [{ id: eastNorthArea.id }, { id: westCentralArea.id }, { id: businessCenterDistrict.id }] },
      },
      {
        name: 'Daryll Kang',
        active: true,
        role: 'ENGINEER' as const,
        countryCode: 'SG',
        sectors: { connect: [{ id: eastNorthArea.id }, { id: westCentralArea.id }, { id: businessCenterDistrict.id }] },
      },
      // Admin and Ops roles
      {
        name: 'Admin User',
        active: true,
        role: 'ADMIN' as const,
        countryCode: 'FR',
        sectors: { connect: [] },
      },
      {
        name: 'Ops Manager',
        active: true,
        role: 'OPS' as const,
        countryCode: 'FR',
        sectors: { connect: [] },
      },
    ]

    const createdEngineers = []
    for (const engineer of engineers) {
      const created = await prisma.engineer.create({ data: engineer })
      createdEngineers.push(created)
    }

    console.log('✅ Created engineers')

    // Create Recurring Shifts
    // Set start date to November 1, 2025 for all recurring shifts
    const startDate = new Date(Date.UTC(2025, 10, 1, 0, 0, 0, 0)) // November 1, 2025
    const endDate = new Date(Date.UTC(
      2025,
      10 + 6, // 6 months from November = May 2026
      1,
      23, 59, 59, 999
    ))
    
    // For past shifts, generate from Nov 1, 2025 to yesterday
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const pastStartDate = new Date(Date.UTC(2025, 10, 1, 0, 0, 0, 0)) // November 1, 2025
    const pastEndDate = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() - 1,
      23, 59, 59, 999
    ))

    // France Recurring Shifts
    const permanencesWeekend = await prisma.recurringShift.create({
      data: {
        name: 'Permanences Weekend',
        start: '08:00',
        end: '20:00',
        type: ShiftType.ONSITE,
        dow: ['Sat', 'Sun'],
        requiredCount: 1,
        countryCode: 'FR',
        sectorIds: [zoneNordNordEst.id, zoneSudOuest.id, sncf.id],
        startDate,
        endDate,
        autoExtend: false,
        active: true,
      },
    })

    const permanencesJourFerie = await prisma.recurringShift.create({
      data: {
        name: 'Permanences Jour Férié',
        start: '08:00',
        end: '20:00',
        type: ShiftType.ONSITE,
        dow: ['PH'],
        requiredCount: 1,
        countryCode: 'FR',
        sectorIds: [zoneNordNordEst.id, zoneSudOuest.id, sncf.id],
        startDate,
        endDate,
        autoExtend: false,
        active: true,
      },
    })

    // Disney Nöel - December 2025 only
    const disneyNoelStart = new Date(Date.UTC(2025, 11, 1, 0, 0, 0, 0)) // December 1, 2025
    const disneyNoelEnd = new Date(Date.UTC(2025, 11, 31, 23, 59, 59, 999)) // December 31, 2025
    const permanencesDisneyNoel = await prisma.recurringShift.create({
      data: {
        name: 'Permanences Disney Nöel',
        start: '08:00',
        end: '20:00',
        type: ShiftType.ONSITE,
        dow: ['Sat', 'Sun'],
        requiredCount: 1,
        countryCode: 'FR',
        sectorIds: [zoneNordNordEst.id],
        startDate: disneyNoelStart,
        endDate: disneyNoelEnd,
        autoExtend: false,
        active: true,
      },
    })

    // UK Recurring Shifts
    const ukWeekendDay = await prisma.recurringShift.create({
      data: {
        name: 'Weekend Day Shift',
        start: '08:00',
        end: '20:00',
        type: ShiftType.ONSITE,
        dow: ['Sat', 'Sun'],
        requiredCount: 1,
        countryCode: 'GB',
        sectorIds: [drivers.id, walkers.id],
        startDate,
        endDate,
        autoExtend: false,
        active: true,
      },
    })

    const ukWeekendNight = await prisma.recurringShift.create({
      data: {
        name: 'Weekend Night Shift',
        start: '20:00',
        end: '08:00',
        type: ShiftType.ONSITE,
        dow: ['Sat', 'Sun'],
        requiredCount: 1,
        countryCode: 'GB',
        sectorIds: [drivers.id, walkers.id],
        startDate,
        endDate,
        autoExtend: false,
        active: true,
      },
    })

    // Singapore Recurring Shifts
    const sb2 = await prisma.recurringShift.create({
      data: {
        name: 'SB2',
        start: '16:00',
        end: '21:30',
        type: ShiftType.ONSITE,
        dow: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        requiredCount: 1,
        countryCode: 'SG',
        sectorIds: [businessCenterDistrict.id],
        startDate,
        endDate,
        autoExtend: false,
        active: true,
      },
    })

    const sb3 = await prisma.recurringShift.create({
      data: {
        name: 'SB3',
        start: '08:30',
        end: '21:30',
        type: ShiftType.ONSITE,
        dow: ['Sat', 'Sun', 'PH'],
        requiredCount: 1,
        countryCode: 'SG',
        sectorIds: [businessCenterDistrict.id],
        startDate,
        endDate,
        autoExtend: false,
        active: true,
      },
    })

    console.log('✅ Created recurring shifts')

    // Generate shifts from recurring shifts for the period
    // All shifts start from November 1, 2025
    // Generate past shifts (from Nov 1, 2025 to yesterday)
    if (pastEndDate >= pastStartDate) {
      // Use regular generator - creates one shift per sector per day
      await generateShiftsFromRecurring(permanencesWeekend.id, pastStartDate, pastEndDate)
      await generateShiftsFromRecurring(permanencesJourFerie.id, pastStartDate, pastEndDate)
      await generateShiftsFromRecurring(ukWeekendDay.id, pastStartDate, pastEndDate)
      await generateShiftsFromRecurring(ukWeekendNight.id, pastStartDate, pastEndDate)
      await generateShiftsFromRecurring(sb2.id, pastStartDate, pastEndDate)
      await generateShiftsFromRecurring(sb3.id, pastStartDate, pastEndDate)
    }
    
    // Generate future shifts (from Nov 1, 2025 to 6 months later)
    await generateShiftsFromRecurring(permanencesWeekend.id, startDate, endDate)
    await generateShiftsFromRecurring(permanencesJourFerie.id, startDate, endDate)
    await generateShiftsFromRecurring(permanencesDisneyNoel.id, disneyNoelStart, disneyNoelEnd)
    await generateShiftsFromRecurring(ukWeekendDay.id, startDate, endDate)
    await generateShiftsFromRecurring(ukWeekendNight.id, startDate, endDate)
    await generateShiftsFromRecurring(sb2.id, startDate, endDate)
    await generateShiftsFromRecurring(sb3.id, startDate, endDate)

    console.log('✅ Generated shifts from recurring shifts')

    // Remove public holiday shifts on Nov 1, 2025 (keep only weekend shift)
    // Nov 1 is a Saturday, so it should only have the weekend shift, not the public holiday shift
    const nov1Date = new Date(Date.UTC(2025, 10, 1, 0, 0, 0, 0))
    const permanencesJourFerieShiftsOnNov1 = await prisma.shift.findMany({
      where: {
        recurringShiftId: permanencesJourFerie.id,
        date: nov1Date,
        countryCode: 'FR',
      },
    })

    if (permanencesJourFerieShiftsOnNov1.length > 0) {
      await prisma.shift.deleteMany({
        where: {
          id: { in: permanencesJourFerieShiftsOnNov1.map(s => s.id) },
        },
      })
      console.log(`✅ Removed ${permanencesJourFerieShiftsOnNov1.length} public holiday shift(s) on Nov 1 (keeping weekend shift only)`)
    }

    // Create one-time shifts
    // Use the today variable already defined above

    // Friday 21 November - Permanence Gare du Nord (SNCF)
    const nov21 = new Date(Date.UTC(today.getUTCFullYear(), 10, 21, 0, 0, 0, 0)) // November 21
    const permanenceGareDuNord = await prisma.recurringShift.create({
      data: {
        name: 'Permanence Gare du Nord',
        start: '16:00',
        end: '02:00',
        type: ShiftType.ONSITE,
        dow: [],
        requiredCount: 1,
          countryCode: 'FR',
        sectorIds: [sncf.id],
        startDate: nov21,
        endDate: new Date(Date.UTC(today.getUTCFullYear(), 10, 22, 1, 59, 59, 999)), // Nov 22 1:59 AM
        autoExtend: false,
        active: true,
      },
    })
    
    // Generate shift for Nov 21
    const nov21Start = new Date(nov21)
    nov21Start.setUTCHours(16, 0, 0, 0)
    const nov21End = new Date(nov21)
    nov21End.setUTCDate(nov21End.getUTCDate() + 1)
    nov21End.setUTCHours(2, 0, 0, 0)
    
    await prisma.shift.create({
      data: {
        date: nov21,
          countryCode: 'FR',
        sectorId: sncf.id,
        recurringShiftId: permanenceGareDuNord.id,
        type: ShiftType.ONSITE,
        plannedStart: nov21Start,
        plannedEnd: nov21End,
        status: ShiftStatus.UNASSIGNED,
      },
    })

    // Saturday 22 November - Arsenal Stadium - Man U Game (Walkers)
    const nov22 = new Date(Date.UTC(today.getUTCFullYear(), 10, 22, 0, 0, 0, 0)) // November 22
    const arsenalStadium = await prisma.recurringShift.create({
      data: {
        name: 'Arsenal Stadium - Man U Game',
        start: '14:00',
        end: '20:00',
        type: ShiftType.ONSITE,
        dow: [],
        requiredCount: 1,
          countryCode: 'GB',
        sectorIds: [walkers.id],
        startDate: nov22,
        endDate: nov22,
        autoExtend: false,
        active: true,
      },
    })
    
    // Generate shift for Nov 22
    const nov22Start = new Date(nov22)
    nov22Start.setUTCHours(14, 0, 0, 0)
    const nov22End = new Date(nov22)
    nov22End.setUTCHours(20, 0, 0, 0)
    
    await prisma.shift.create({
        data: {
        date: nov22,
        countryCode: 'GB',
        sectorId: walkers.id,
        recurringShiftId: arsenalStadium.id,
        type: ShiftType.ONSITE,
        plannedStart: nov22Start,
        plannedEnd: nov22End,
        status: ShiftStatus.UNASSIGNED,
      },
    })

    console.log('✅ Created one-time shifts')

    // Create past completed shifts with assignments
    // Get ALL past shifts that were generated and mark them as completed with assignments
    const pastShifts = await prisma.shift.findMany({
      where: {
        date: {
          lt: today,
        },
        status: {
          not: ShiftStatus.COMPLETED,
        },
      },
    })

    // Assign engineers to ALL past shifts and mark as completed
    for (let i = 0; i < pastShifts.length; i++) {
      const shift = pastShifts[i]
      const countryEngineers = createdEngineers.filter(e => e.countryCode === shift.countryCode)
      if (countryEngineers.length > 0) {
        const engineerIndex = i % countryEngineers.length
        const engineer = countryEngineers[engineerIndex]
        
        // Update shift to completed
        await prisma.shift.update({
          where: { id: shift.id },
        data: {
            status: ShiftStatus.COMPLETED,
            type: ShiftType.REMOTE, // Past shifts are REMOTE
            performedStart: shift.plannedStart,
            performedEnd: shift.plannedEnd,
          },
        })
        
        // Create assignment if it doesn't exist
        const existingAssignment = await prisma.assignment.findFirst({
          where: {
            shiftId: shift.id,
          },
        })
        
        if (!existingAssignment) {
      await prisma.assignment.create({
        data: {
              shiftId: shift.id,
              engineerId: engineer.id,
          createdBy: 'system',
        },
      })
        }
      }
    }

    console.log('✅ Created past completed shifts with assignments')

    console.log('🎉 Production seeding completed!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })


