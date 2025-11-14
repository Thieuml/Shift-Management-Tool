import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateShiftsFromRecurring } from '@/lib/recurring-shift-generator'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { endDate: endDateString } = body

    if (!endDateString) {
      return NextResponse.json(
        { error: 'endDate is required' },
        { status: 400 }
      )
    }

    const recurringShift = await prisma.recurringShift.findUnique({
      where: { id },
    })

    if (!recurringShift || !recurringShift.active) {
      return NextResponse.json(
        { error: 'Recurring shift not found or inactive' },
        { status: 404 }
      )
    }

    // Parse and validate new end date
    const newEndDate = new Date(endDateString)
    newEndDate.setUTCHours(23, 59, 59, 999)

    // Validate: new end date must be after current end date
    if (newEndDate <= recurringShift.endDate) {
      return NextResponse.json(
        { error: 'New end date must be after current end date' },
        { status: 400 }
      )
    }

    // Validate max 6 months from current end date
    const maxEndDate = new Date(Date.UTC(
      recurringShift.endDate.getUTCFullYear(),
      recurringShift.endDate.getUTCMonth() + 6,
      recurringShift.endDate.getUTCDate(),
      23, 59, 59, 999
    ))

    if (newEndDate > maxEndDate) {
      return NextResponse.json(
        { error: 'Cannot extend more than 6 months from current end date' },
        { status: 400 }
      )
    }

    // Update end date
    const updated = await prisma.recurringShift.update({
      where: { id },
      data: { endDate: newEndDate },
    })

    // Generate shifts for the new period
    const startDate = new Date(recurringShift.endDate)
    startDate.setUTCDate(startDate.getUTCDate() + 1)
    startDate.setUTCHours(0, 0, 0, 0)

    const generatedShifts =
      (await generateShiftsFromRecurring(id, startDate, newEndDate)) || 0

    return NextResponse.json({
      success: true,
      recurringShift: updated,
      generatedShifts,
      newEndDate: newEndDate.toISOString().split('T')[0],
    })
  } catch (error) {
    console.error('Error extending recurring shift:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

