import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { performedBodySchema } from '@/lib/zod'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shiftId = params.id

  try {
    // Parse and validate request body
    const body = await request.json()
    const validation = performedBodySchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { performedStart, performedEnd } = validation.data

    // Check if shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
    })

    if (!shift) {
      return NextResponse.json(
        { error: 'Shift not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: {
      performedStart?: Date
      performedEnd?: Date
      status?: 'COMPLETED'
      updatedBy?: string
    } = {
      updatedBy: 'system', // TODO: Get from auth session
    }

    if (performedStart) {
      updateData.performedStart = new Date(performedStart)
    }

    if (performedEnd) {
      updateData.performedEnd = new Date(performedEnd)
      // If both start and end are provided, mark as completed
      if (performedStart || shift.performedStart) {
        updateData.status = 'COMPLETED'
      }
    }

    // Update shift
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: updateData,
      include: {
        sector: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          include: {
            engineer: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json({ shift: updatedShift })
  } catch (error) {
    console.error('Error updating performed times:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

