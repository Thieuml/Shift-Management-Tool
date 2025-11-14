import { NextRequest } from 'next/server'
import { POST as assignPOST } from '@/app/api/shifts/[id]/assign/route'
import { POST as reassignPOST } from '@/app/api/shifts/[id]/reassign/route'
import { POST as unassignPOST } from '@/app/api/shifts/[id]/unassign/route'
import { cleanupDatabase, seedTestData, prisma } from '../setup/prisma'

describe('POST /api/shifts/:id/assign', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
    await prisma.$disconnect()
  })

  it('should assign an engineer to an unassigned shift', async () => {
    const { shift, engineer1 } = await seedTestData()

    const url = new URL(`http://localhost:3000/api/shifts/${shift.id}/assign`)
    const req = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({ engineerId: engineer1.id }),
    })

    const response = await assignPOST(req, { params: { id: shift.id } })
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.assignment).toBeDefined()
    expect(data.assignment.engineerId).toBe(engineer1.id)
    expect(data.assignment.shiftId).toBe(shift.id)

    // Verify shift status updated
    const updatedShift = await prisma.shift.findUnique({
      where: { id: shift.id },
    })
    expect(updatedShift?.status).toBe('ASSIGNED')
  })

  it('should return 404 for non-existent shift', async () => {
    const { engineer1 } = await seedTestData()

    const url = new URL('http://localhost:3000/api/shifts/non-existent/assign')
    const req = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({ engineerId: engineer1.id }),
    })

    const response = await assignPOST(req, { params: { id: 'non-existent' } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBeDefined()
  })

  it('should return 404 for non-existent engineer', async () => {
    const { shift } = await seedTestData()

    const url = new URL(`http://localhost:3000/api/shifts/${shift.id}/assign`)
    const req = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({ engineerId: 'non-existent' }),
    })

    const response = await assignPOST(req, { params: { id: shift.id } })
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBeDefined()
  })

  it('should return 409 for overlapping shifts', async () => {
    const { shift, engineer1, sector, template } = await seedTestData()

    // Create overlapping shift
    const overlappingDate = new Date(shift.plannedStart)
    const overlappingShift = await prisma.shift.create({
      data: {
        date: overlappingDate,
        countryCode: 'FR',
        sectorId: sector.id,
        templateId: template.id,
        type: 'ONSITE',
        plannedStart: shift.plannedStart,
        plannedEnd: shift.plannedEnd,
        status: 'ASSIGNED',
      },
    })

    // Assign engineer to overlapping shift
    await prisma.assignment.create({
      data: {
        shiftId: overlappingShift.id,
        engineerId: engineer1.id,
      },
    })

    // Try to assign same engineer to original shift
    const url = new URL(`http://localhost:3000/api/shifts/${shift.id}/assign`)
    const req = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({ engineerId: engineer1.id }),
    })

    const response = await assignPOST(req, { params: { id: shift.id } })
    const data = await response.json()

    expect(response.status).toBe(409)
    expect(data.error).toContain('overlapping')
  })
})

describe('POST /api/shifts/:id/reassign', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
    await prisma.$disconnect()
  })

  it('should reassign a shift to a different engineer', async () => {
    const { shift, engineer1, engineer2 } = await seedTestData()

    // First assign engineer1
    await prisma.assignment.create({
      data: {
        shiftId: shift.id,
        engineerId: engineer1.id,
      },
    })
    await prisma.shift.update({
      where: { id: shift.id },
      data: { status: 'ASSIGNED' },
    })

    // Reassign to engineer2
    const url = new URL(`http://localhost:3000/api/shifts/${shift.id}/reassign`)
    const req = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({ engineerId: engineer2.id }),
    })

    const response = await reassignPOST(req, { params: { id: shift.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.assignment).toBeDefined()
    expect(data.assignment.engineerId).toBe(engineer2.id)

    // Verify old assignment removed
    const assignments = await prisma.assignment.findMany({
      where: { shiftId: shift.id },
    })
    expect(assignments.length).toBe(1)
    expect(assignments[0].engineerId).toBe(engineer2.id)
  })
})

describe('POST /api/shifts/:id/unassign', () => {
  beforeEach(async () => {
    await cleanupDatabase()
  })

  afterAll(async () => {
    await cleanupDatabase()
    await prisma.$disconnect()
  })

  it('should unassign an engineer from a shift', async () => {
    const { shift, engineer1 } = await seedTestData()

    // Assign engineer
    await prisma.assignment.create({
      data: {
        shiftId: shift.id,
        engineerId: engineer1.id,
      },
    })
    await prisma.shift.update({
      where: { id: shift.id },
      data: { status: 'ASSIGNED' },
    })

    // Unassign
    const url = new URL(`http://localhost:3000/api/shifts/${shift.id}/unassign`)
    const req = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({ engineerId: engineer1.id }),
    })

    const response = await unassignPOST(req, { params: { id: shift.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toBeDefined()

    // Verify assignment removed and status updated
    const assignments = await prisma.assignment.findMany({
      where: { shiftId: shift.id },
    })
    expect(assignments.length).toBe(0)

    const updatedShift = await prisma.shift.findUnique({
      where: { id: shift.id },
    })
    expect(updatedShift?.status).toBe('UNASSIGNED')
  })

  it('should unassign all engineers when engineerId not provided', async () => {
    const { shift, engineer1, engineer2 } = await seedTestData()

    // Assign multiple engineers (if multiple assignments allowed)
    await prisma.assignment.create({
      data: {
        shiftId: shift.id,
        engineerId: engineer1.id,
      },
    })

    // Unassign all
    const url = new URL(`http://localhost:3000/api/shifts/${shift.id}/unassign`)
    const req = new NextRequest(url, {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await unassignPOST(req, { params: { id: shift.id } })
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.message).toContain('All engineers')

    const assignments = await prisma.assignment.findMany({
      where: { shiftId: shift.id },
    })
    expect(assignments.length).toBe(0)
  })
})

