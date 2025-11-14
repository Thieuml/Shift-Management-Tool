import request from 'supertest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/schedule/route'
import { cleanupDatabase, seedTestData, prisma } from '../setup/prisma'

describe('GET /api/schedule', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
    await prisma.$disconnect()
  })

  it('should return shifts for a valid date range', async () => {
    const { shift } = await seedTestData()

    const from = new Date(shift.date)
    from.setDate(from.getDate() - 1)
    const to = new Date(shift.date)
    to.setDate(to.getDate() + 1)

    const fromStr = from.toISOString().split('T')[0]
    const toStr = to.toISOString().split('T')[0]

    const url = new URL(`http://localhost:3000/api/schedule?country=FR&from=${fromStr}&to=${toStr}`)
    const req = new NextRequest(url)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.shifts).toBeDefined()
    expect(Array.isArray(data.shifts)).toBe(true)
    expect(data.shifts.length).toBeGreaterThan(0)
    expect(data.shifts[0]).toHaveProperty('id')
    expect(data.shifts[0]).toHaveProperty('sector')
    expect(data.shifts[0]).toHaveProperty('template')
  })

  it('should return empty array when no shifts found', async () => {
    const from = '2020-01-01'
    const to = '2020-01-31'

    const url = new URL(`http://localhost:3000/api/schedule?country=FR&from=${from}&to=${to}`)
    const req = new NextRequest(url)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.shifts).toEqual([])
  })

  it('should return 400 for invalid query parameters', async () => {
    const url = new URL('http://localhost:3000/api/schedule?country=FR')
    const req = new NextRequest(url)

    const response = await GET(req)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBeDefined()
  })

  it('should filter shifts by country', async () => {
    await seedTestData()

    const from = '2020-01-01'
    const to = '2030-12-31'

    // Test FR country
    const urlFR = new URL(`http://localhost:3000/api/schedule?country=FR&from=${from}&to=${to}`)
    const reqFR = new NextRequest(urlFR)
    const responseFR = await GET(reqFR)
    const dataFR = await responseFR.json()

    expect(responseFR.status).toBe(200)
    expect(dataFR.shifts.length).toBeGreaterThan(0)

    // Test GB country (should be empty)
    const urlGB = new URL(`http://localhost:3000/api/schedule?country=GB&from=${from}&to=${to}`)
    const reqGB = new NextRequest(urlGB)
    const responseGB = await GET(reqGB)
    const dataGB = await responseGB.json()

    expect(responseGB.status).toBe(200)
    expect(dataGB.shifts).toEqual([])
  })
})

