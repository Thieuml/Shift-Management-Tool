import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ShiftType, ShiftStatus } from '@prisma/client'
import { generateShiftsFromRecurring } from '@/lib/recurring-shift-generator'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const country = searchParams.get('country')

    // Build where clause - only show active recurring shifts
    const where: any = {
      active: true,
    }

    if (country) {
      where.countryCode = country
    }

    const recurringShifts = await prisma.recurringShift.findMany({
      where,
      include: {
        country: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ recurringShifts })
  } catch (error) {
    console.error('Error fetching recurring shifts:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}


export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      start,
      end,
      type,
      dow,
      requiredCount = 1,
      countryCode,
      sectorIds,
      shiftType, // 'recurring' or 'one-shot'
      recurringStartDate, // For recurring shifts
      recurringEndDate, // For recurring shifts
      oneShotDate, // For one-shot shifts
      autoExtend = false,
    } = body

    // Basic validation
    if (!name || !start || !end || !type || !countryCode) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      )
    }

    // Validate shiftType is provided
    if (
      !shiftType ||
      (shiftType !== 'recurring' && shiftType !== 'one-shot')
    ) {
      return NextResponse.json(
        { error: 'shiftType must be either "recurring" or "one-shot"' },
        { status: 400 }
      )
    }

    // Days of week validation only for recurring shifts
    if (shiftType === 'recurring' && (!Array.isArray(dow) || dow.length === 0)) {
      return NextResponse.json(
        { error: 'dow must be a non-empty array for recurring shifts' },
        { status: 400 }
      )
    }

    if (!sectorIds || sectorIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one sector must be selected' },
        { status: 400 }
      )
    }

    // Validate shift type and dates
    if (shiftType === 'recurring') {
      if (!recurringStartDate || !recurringEndDate) {
        return NextResponse.json(
          { error: 'Start and end dates are required for recurring shifts' },
          { status: 400 }
        )
      }
    } else {
      // shiftType === 'one-shot'
      if (!oneShotDate) {
        return NextResponse.json(
          { error: 'Date is required for one-shot shifts' },
          { status: 400 }
        )
      }
    }

    // Parse dates
    let startDate: Date
    let endDate: Date

    if (shiftType === 'recurring') {
      const startParts = recurringStartDate.split('-').map(Number)
      startDate = new Date(
        Date.UTC(startParts[0], startParts[1] - 1, startParts[2], 0, 0, 0, 0)
      )

      const endParts = recurringEndDate.split('-').map(Number)
      endDate = new Date(
        Date.UTC(endParts[0], endParts[1] - 1, endParts[2], 23, 59, 59, 999)
      )

      // Validate date range (max 6 months)
      const maxEndDate = new Date(
        Date.UTC(
          startDate.getUTCFullYear(),
          startDate.getUTCMonth() + 6,
          startDate.getUTCDate(),
          23,
          59,
          59,
          999
        )
      )

      if (endDate > maxEndDate) {
        return NextResponse.json(
          { error: 'Date range cannot exceed 6 months' },
          { status: 400 }
        )
      }
    } else {
      // One-shot: use the same date for start and end
      const dateParts = oneShotDate.split('-').map(Number)
      startDate = new Date(
        Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0, 0)
      )
      endDate = new Date(
        Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], 23, 59, 59, 999)
      )
    }

    // Create recurring shift (even for one-shot, we store it for consistency)
    const recurringShift = await prisma.recurringShift.create({
      data: {
        name,
        start,
        end,
        type: type as ShiftType,
        dow: shiftType === 'recurring' ? dow : [],
        requiredCount,
        countryCode,
        sectorIds,
        startDate,
        endDate,
        autoExtend,
        active: true,
      },
      include: {
        country: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    })

    // Generate shifts
    let generatedShifts = 0
    try {
      if (shiftType === 'recurring') {
        generatedShifts =
          (await generateShiftsFromRecurring(
            recurringShift.id,
            startDate,
            endDate
          )) || 0
      } else {
        // One-shot: generate shifts only for the specific date
        const dateParts = oneShotDate.split('-').map(Number)
        const targetDate = new Date(
          Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], 0, 0, 0, 0)
        )

        // Get sectors
        const sectorsToUse = await prisma.sector.findMany({
          where: { id: { in: sectorIds } },
        })

        if (sectorsToUse.length === 0) {
          return NextResponse.json(
            { error: 'No valid sectors found' },
            { status: 400 }
          )
        }

        // Parse start/end times
        const [startHour, startMin] = start.split(':').map(Number)
        const [endHour, endMin] = end.split(':').map(Number)

        // Create shifts for each sector
        const shifts = []
        for (const sector of sectorsToUse) {
          const plannedStart = new Date(targetDate)
          plannedStart.setUTCHours(startHour, startMin, 0, 0)

          let plannedEnd = new Date(targetDate)
          plannedEnd.setUTCHours(endHour, endMin, 0, 0)

          // Handle night shifts that span midnight
          if (
            endHour < startHour ||
            (endHour === startHour && endMin < startMin)
          ) {
            plannedEnd.setUTCDate(plannedEnd.getUTCDate() + 1)
          }

          // Check if shift already exists
          const existing = await prisma.shift.findFirst({
            where: {
              recurringShiftId: recurringShift.id,
              sectorId: sector.id,
              date: targetDate,
            },
          })

          if (!existing) {
            shifts.push({
              date: new Date(targetDate),
              countryCode: recurringShift.countryCode,
              sectorId: sector.id,
              templateId: null, // Deprecated field, kept for backward compatibility
              recurringShiftId: recurringShift.id,
              type: recurringShift.type,
              plannedStart,
              plannedEnd,
              status: ShiftStatus.UNASSIGNED,
            })
          }
        }

        // Bulk create shifts
        if (shifts.length > 0) {
          await prisma.shift.createMany({
            data: shifts,
            skipDuplicates: true,
          })
        }

        generatedShifts = shifts.length
      }
    } catch (error) {
      console.error('Error generating shifts:', error)
      return NextResponse.json(
        {
          error:
            error instanceof Error ? error.message : 'Failed to generate shifts',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        recurringShift,
        generatedShifts,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating recurring shift:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

