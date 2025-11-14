import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { reassignBodySchema } from '@/lib/zod'
import { acquireLock, releaseLock } from '@/lib/redis'
import { ShiftStatus } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shiftId = params.id
  let lockValue: string | null = null

  try {
    // Acquire Redis lock
    lockValue = await acquireLock(`shift:${shiftId}:reassign`, 10)
    if (!lockValue) {
      return NextResponse.json(
        { error: 'Could not acquire lock. Please try again.' },
        { status: 409 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = reassignBodySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { engineerId } = validation.data

    // Check if shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        assignments: true,
      },
    })

    if (!shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      )
    }

    // Check if engineer exists and is active
    const engineer = await prisma.engineer.findUnique({
      where: { id: engineerId },
    })

    if (!engineer || !engineer.active) {
      return NextResponse.json(
        { error: 'Engineer not found or inactive' },
        { status: 404 }
      )
    }

    // Check if engineer is already assigned to this shift
    const existingAssignment = shift.assignments.find(
      (a) => a.engineerId === engineerId
    )

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Engineer is already assigned to this shift' },
        { status: 409 }
      )
    }

    // Check if engineer has overlapping shifts
    const overlappingShift = await prisma.shift.findFirst({
      where: {
        id: { not: shiftId },
        assignments: {
          some: {
            engineerId: engineerId,
          },
        },
        plannedStart: {
          lt: shift.plannedEnd,
        },
        plannedEnd: {
          gt: shift.plannedStart,
        },
      },
    })

    if (overlappingShift) {
      return NextResponse.json(
        { error: 'Engineer has an overlapping shift' },
        { status: 409 }
      )
    }

    // Check if shift is in the past
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const shiftDate = new Date(shift.date)
    shiftDate.setUTCHours(0, 0, 0, 0)
    const isPastShift = shiftDate < today

    // Determine status: COMPLETED for past shifts, ASSIGNED for future shifts
    const newStatus = isPastShift ? ShiftStatus.COMPLETED : ShiftStatus.ASSIGNED

    // Delete all existing assignments and create new one
    const [, assignment] = await prisma.$transaction([
      prisma.assignment.deleteMany({
        where: { shiftId },
      }),
      prisma.assignment.create({
        data: {
          shiftId,
          engineerId,
          createdBy: 'system', // TODO: Get from auth session
        },
        include: {
          engineer: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.shift.update({
        where: { id: shiftId },
        data: {
          status: newStatus,
          // For past shifts, set performed times to match planned times
          performedStart: isPastShift ? shift.plannedStart : null,
          performedEnd: isPastShift ? shift.plannedEnd : null,
          updatedBy: 'system', // TODO: Get from auth session
        },
      }),
    ])

    return NextResponse.json({ assignment })
  } catch (error) {
    console.error('Error reassigning shift:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    // Always release the lock
    if (lockValue) {
      await releaseLock(`shift:${shiftId}:reassign`, lockValue)
    }
  }
}

