import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
})

export async function cleanupDatabase() {
  // Delete in reverse order of dependencies
  await prisma.assignment.deleteMany()
  await prisma.shift.deleteMany()
  await prisma.shiftTemplate.deleteMany()
  await prisma.engineer.deleteMany()
  await prisma.sector.deleteMany()
  await prisma.holiday.deleteMany()
  await prisma.country.deleteMany()
}

export async function seedTestData() {
  // Create test countries
  const france = await prisma.country.create({
    data: {
      code: 'FR',
      name: 'France',
      timezone: 'Europe/Paris',
    },
  })

  // Create test sector
  const sector = await prisma.sector.create({
    data: {
      name: 'Test Sector',
      active: true,
      countryCode: 'FR',
    },
  })

  // Create test engineers
  const engineer1 = await prisma.engineer.create({
    data: {
      name: 'Test Engineer 1',
      active: true,
      role: 'ENGINEER',
      countryCode: 'FR',
      sectors: {
        connect: { id: sector.id },
      },
    },
  })

  const engineer2 = await prisma.engineer.create({
    data: {
      name: 'Test Engineer 2',
      active: true,
      role: 'ENGINEER',
      countryCode: 'FR',
      sectors: {
        connect: { id: sector.id },
      },
    },
  })

  // Create test shift template
  const template = await prisma.shiftTemplate.create({
    data: {
      name: 'Test Template',
      start: '08:00',
      end: '20:00',
      type: 'ONSITE',
      dow: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      requiredCount: 1,
      countryCode: 'FR',
    },
  })

  // Create test shift
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setUTCHours(0, 0, 0, 0)

  const plannedStart = new Date(tomorrow)
  plannedStart.setUTCHours(8, 0, 0, 0)

  const plannedEnd = new Date(tomorrow)
  plannedEnd.setUTCHours(20, 0, 0, 0)

  const shift = await prisma.shift.create({
    data: {
      date: tomorrow,
      countryCode: 'FR',
      sectorId: sector.id,
      templateId: template.id,
      type: 'ONSITE',
      plannedStart,
      plannedEnd,
      status: 'UNASSIGNED',
    },
  })

  return {
    france,
    sector,
    engineer1,
    engineer2,
    template,
    shift,
  }
}

export { prisma }

