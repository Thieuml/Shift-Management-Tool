import { NextRequest } from 'next/server'
import { GET } from '@/app/api/engineers/route'
import { cleanupDatabase, seedTestData, prisma } from '../setup/prisma'

describe('GET /api/engineers', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
    await prisma.$disconnect()
  })

  it('should return engineers for a valid country and time range', async () => {
    const { engineer1, engineer2 } = await seedTestData()

    const start = new Date()
    start.setDate(start.getDate() - 1)
    start.setUTCHours(0, 0, 0, 0)

    const end = new Date()
    end.setDate(end.getDate() + 1)
    end.setUTCHours(23, 59, 59, 0)

    const url = new URL(
      `http://localhost:3000/api/engineers?country=FR&start=${start.toISOString()}&end=${end.toISOString()}`
    )
    const req = new NextRequest(url)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.engineers).toBeDefined()
    expect(Array.isArray(data.engineers)).toBe(true)
    expect(data.engineers.length).toBeGreaterThanOrEqual(2)
    expect(data.engineers.some((e: any) => e.id === engineer1.id)).toBe(true)
    expect(data.engineers.some((e: any) => e.id === engineer2.id)).toBe(true)
  })

  it('should filter engineers by sector when provided', async () => {
    const { engineer1, sector } = await seedTestData()

    const start = new Date()
    start.setDate(start.getDate() - 1)
    start.setUTCHours(0, 0, 0, 0)

    const end = new Date()
    end.setDate(end.getDate() + 1)
    end.setUTCHours(23, 59, 59, 0)

    const url = new URL(
      `http://localhost:3000/api/engineers?country=FR&sector=${sector.id}&start=${start.toISOString()}&end=${end.toISOString()}`
    )
    const req = new NextRequest(url)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.engineers).toBeDefined()
    expect(data.engineers.length).toBeGreaterThan(0)
    // All returned engineers should be in the specified sector
    data.engineers.forEach((engineer: any) => {
      expect(engineer.sectors.some((s: any) => s.id === sector.id)).toBe(true)
    })
  })

  it('should return 400 for invalid query parameters', async () => {
    const url = new URL('http://localhost:3000/api/engineers?country=FR')
    const req = new NextRequest(url)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should include assignments for engineers', async () => {
    const { engineer1, shift } = await seedTestData()

    // Assign engineer to shift
    await prisma.assignment.create({
      data: {
        shiftId: shift.id,
        engineerId: engineer1.id,
      },
    })

    const start = new Date(shift.plannedStart)
    start.setDate(start.getDate() - 1)

    const end = new Date(shift.plannedEnd)
    end.setDate(end.getDate() + 1)

    const url = new URL(
      `http://localhost:3000/api/engineers?country=FR&start=${start.toISOString()}&end=${end.toISOString()}`
    )
    const req = new NextRequest(url)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    const engineer = data.engineers.find((e: any) => e.id === engineer1.id)
    expect(engineer).toBeDefined()
    expect(engineer.assignments).toBeDefined()
    expect(engineer.assignments.length).toBeGreaterThan(0)
    expect(engineer.assignments[0].shift.id).toBe(shift.id)
  })
})

