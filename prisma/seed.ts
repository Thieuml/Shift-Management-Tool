import { PrismaClient, Role, ShiftType, ShiftStatus } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
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

  for (const holiday of holidays) {
    await prisma.holiday.create({ data: holiday })
  }

  console.log('✅ Created holidays')

  // Create Sectors
  const parisNorth = await prisma.sector.create({
    data: {
      name: 'Paris North',
      active: true,
      countryCode: 'FR',
    },
  })

  const parisSouth = await prisma.sector.create({
    data: {
      name: 'Paris South',
      active: true,
      countryCode: 'FR',
    },
  })

  const londonCentral = await prisma.sector.create({
    data: {
      name: 'London Central',
      active: true,
      countryCode: 'GB',
    },
  })

  console.log('✅ Created sectors')

  // Create Engineers
  const engineers = [
    {
      name: 'Jean Dupont',
      active: true,
      role: Role.ENGINEER,
      countryCode: 'FR',
      sectors: { connect: [{ id: parisNorth.id }, { id: parisSouth.id }] },
    },
    {
      name: 'Marie Martin',
      active: true,
      role: Role.ENGINEER,
      countryCode: 'FR',
      sectors: { connect: [{ id: parisNorth.id }] },
    },
    {
      name: 'Pierre Bernard',
      active: true,
      role: Role.ENGINEER,
      countryCode: 'FR',
      sectors: { connect: [{ id: parisSouth.id }] },
    },
    {
      name: 'John Smith',
      active: true,
      role: Role.ENGINEER,
      countryCode: 'GB',
      sectors: { connect: [{ id: londonCentral.id }] },
    },
    {
      name: 'Sarah Johnson',
      active: true,
      role: Role.ENGINEER,
      countryCode: 'GB',
      sectors: { connect: [{ id: londonCentral.id }] },
    },
    {
      name: 'Admin User',
      active: true,
      role: Role.ADMIN,
      countryCode: 'FR',
      sectors: { connect: [] },
    },
    {
      name: 'Ops Manager',
      active: true,
      role: Role.OPS,
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
  const seedToday = new Date()
  seedToday.setUTCHours(0, 0, 0, 0)
  const startDate = new Date(Date.UTC(
    seedToday.getUTCFullYear(),
    seedToday.getUTCMonth(),
    seedToday.getUTCDate(),
    0, 0, 0, 0
  ))
  const endDate = new Date(Date.UTC(
    seedToday.getUTCFullYear(),
    seedToday.getUTCMonth() + 6,
    seedToday.getUTCDate(),
    23, 59, 59, 999
  ))

  const weekendOnsite = await prisma.recurringShift.create({
    data: {
      name: 'Weekend Onsite',
      start: '08:00',
      end: '20:00',
      type: ShiftType.ONSITE,
      dow: ['Sat', 'Sun'],
      requiredCount: 2,
      countryCode: 'FR',
      sectorIds: [parisNorth.id, parisSouth.id],
      startDate,
      endDate,
      autoExtend: false,
      active: true,
    },
  })

  const weekdayRemote = await prisma.recurringShift.create({
    data: {
      name: 'Weekday Remote',
      start: '09:00',
      end: '18:00',
      type: ShiftType.REMOTE,
      dow: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      requiredCount: 1,
      countryCode: 'FR',
      sectorIds: [parisNorth.id],
      startDate,
      endDate,
      autoExtend: false,
      active: true,
    },
  })

  const ukWeekend = await prisma.recurringShift.create({
    data: {
      name: 'UK Weekend Onsite',
      start: '08:00',
      end: '20:00',
      type: ShiftType.ONSITE,
      dow: ['Sat', 'Sun'],
      requiredCount: 1,
      countryCode: 'GB',
      sectorIds: [londonCentral.id],
      startDate,
      endDate,
      autoExtend: false,
      active: true,
    },
  })

  console.log('✅ Created recurring shifts')

  // Create Shifts for the next 2 weeks
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const shifts = []

  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setUTCDate(today.getUTCDate() + i)
    
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()]
    const isWeekend = dayOfWeek === 'Sat' || dayOfWeek === 'Sun'

    // France shifts
    if (isWeekend) {
      const plannedStart = new Date(date)
      plannedStart.setUTCHours(8, 0, 0, 0)
      const plannedEnd = new Date(date)
      plannedEnd.setUTCHours(20, 0, 0, 0)

      shifts.push({
        date,
        countryCode: 'FR',
        sectorId: parisNorth.id,
        templateId: null, // Deprecated
        recurringShiftId: weekendOnsite.id,
        type: ShiftType.ONSITE,
        plannedStart,
        plannedEnd,
        status: i < 2 ? ShiftStatus.ASSIGNED : ShiftStatus.UNASSIGNED,
      })

      shifts.push({
        date,
        countryCode: 'FR',
        sectorId: parisSouth.id,
        templateId: null, // Deprecated
        recurringShiftId: weekendOnsite.id,
        type: ShiftType.ONSITE,
        plannedStart,
        plannedEnd,
        status: ShiftStatus.UNASSIGNED,
      })
    } else {
      const plannedStart = new Date(date)
      plannedStart.setUTCHours(9, 0, 0, 0)
      const plannedEnd = new Date(date)
      plannedEnd.setUTCHours(18, 0, 0, 0)

      shifts.push({
        date,
        countryCode: 'FR',
        sectorId: parisNorth.id,
        templateId: null, // Deprecated
        recurringShiftId: weekdayRemote.id,
        type: ShiftType.REMOTE,
        plannedStart,
        plannedEnd,
        status: ShiftStatus.UNASSIGNED,
      })
    }

    // UK shifts (weekends only)
    if (isWeekend) {
      const plannedStart = new Date(date)
      plannedStart.setUTCHours(8, 0, 0, 0)
      const plannedEnd = new Date(date)
      plannedEnd.setUTCHours(20, 0, 0, 0)

      shifts.push({
        date,
        countryCode: 'GB',
        sectorId: londonCentral.id,
        templateId: null, // Deprecated
        recurringShiftId: ukWeekend.id,
        type: ShiftType.ONSITE,
        plannedStart,
        plannedEnd,
        status: i === 0 ? ShiftStatus.ASSIGNED : ShiftStatus.UNASSIGNED,
      })
    }
  }

  const createdShifts = []
  for (const shift of shifts) {
    const created = await prisma.shift.create({ data: shift })
    createdShifts.push(created)
  }

  console.log('✅ Created shifts')

  // Create Assignments for assigned shifts
  const assignedShifts = createdShifts.filter(s => s.status === ShiftStatus.ASSIGNED)
  
  // Assign Jean Dupont to first weekend shift
  if (assignedShifts.length > 0 && assignedShifts[0].countryCode === 'FR') {
    await prisma.assignment.create({
      data: {
        shiftId: assignedShifts[0].id,
        engineerId: createdEngineers[0].id, // Jean Dupont
        createdBy: 'system',
      },
    })
  }

  // Assign Marie Martin to second weekend shift
  if (assignedShifts.length > 1 && assignedShifts[1].countryCode === 'FR') {
    await prisma.assignment.create({
      data: {
        shiftId: assignedShifts[1].id,
        engineerId: createdEngineers[1].id, // Marie Martin
        createdBy: 'system',
      },
    })
  }

  // Assign John Smith to UK weekend shift
  const ukShift = assignedShifts.find(s => s.countryCode === 'GB')
  if (ukShift) {
    await prisma.assignment.create({
      data: {
        shiftId: ukShift.id,
        engineerId: createdEngineers[3].id, // John Smith
        createdBy: 'system',
      },
    })
  }

  console.log('✅ Created assignments')

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

