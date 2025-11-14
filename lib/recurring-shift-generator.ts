import { prisma } from '@/lib/prisma'
import { ShiftStatus } from '@prisma/client'

export async function generateShiftsFromRecurring(
  recurringShiftId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const recurringShift = await prisma.recurringShift.findUnique({
    where: { id: recurringShiftId },
  })

  if (!recurringShift || !recurringShift.active) return 0

  // Get sectors
  const sectorsToUse = await prisma.sector.findMany({
    where: { id: { in: recurringShift.sectorIds } },
  })

  if (sectorsToUse.length === 0) return 0

  // Validate date range (max 6 months)
  // Use UTC date arithmetic to avoid timezone issues
  const maxEndDate = new Date(Date.UTC(
    startDate.getUTCFullYear(),
    startDate.getUTCMonth() + 6,
    startDate.getUTCDate(),
    23, 59, 59, 999
  ))
  if (endDate > maxEndDate) {
    throw new Error('Date range cannot exceed 6 months')
  }

  // Get holidays
  const holidays = await prisma.holiday.findMany({
    where: {
      countryCode: recurringShift.countryCode,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  })
  const holidayDates = new Set(
    holidays.map((h) => h.date.toISOString().split('T')[0])
  )

  // Generate shifts
  const shifts = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][
      currentDate.getUTCDay()
    ]
    const isPublicHoliday = holidayDates.has(dateKey)

    const matchesDay =
      recurringShift.dow.includes(dayOfWeek) ||
      (isPublicHoliday && recurringShift.dow.includes('PH'))

    if (matchesDay) {
      const [startHour, startMin] = recurringShift.start
        .split(':')
        .map(Number)
      const [endHour, endMin] = recurringShift.end.split(':').map(Number)

      for (const sector of sectorsToUse) {
        const plannedStart = new Date(currentDate)
        plannedStart.setUTCHours(startHour, startMin, 0, 0)

        let plannedEnd = new Date(currentDate)
        plannedEnd.setUTCHours(endHour, endMin, 0, 0)

        // Handle night shifts that span midnight
        if (
          endHour < startHour ||
          (endHour === startHour && endMin < startMin)
        ) {
          plannedEnd.setUTCDate(plannedEnd.getUTCDate() + 1)
        }

        const existing = await prisma.shift.findFirst({
          where: {
            recurringShiftId: recurringShift.id,
            sectorId: sector.id,
            date: currentDate,
          },
        })

        if (!existing) {
          shifts.push({
            date: new Date(currentDate),
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
    }

    currentDate.setUTCDate(currentDate.getUTCDate() + 1)
  }

  if (shifts.length > 0) {
    await prisma.shift.createMany({
      data: shifts,
      skipDuplicates: true,
    })
  }

  return shifts.length
}

