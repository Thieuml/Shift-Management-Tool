import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const recurringShift = await prisma.recurringShift.findUnique({
      where: { id },
    })

    if (!recurringShift) {
      return NextResponse.json(
        { error: 'Recurring shift not found' },
        { status: 404 }
      )
    }

    // Find all shifts linked to this recurring shift
    const linkedShifts = await prisma.shift.findMany({
      where: {
        recurringShiftId: id,
      },
      select: {
        id: true,
      },
    })

    const shiftIds = linkedShifts.map(shift => shift.id)

    // Delete all assignments for these shifts first (due to foreign key constraints)
    if (shiftIds.length > 0) {
      await prisma.assignment.deleteMany({
        where: {
          shiftId: {
            in: shiftIds,
          },
        },
      })

      // Delete all shifts linked to this recurring shift
      await prisma.shift.deleteMany({
        where: {
          recurringShiftId: id,
        },
      })
    }

    // Soft delete: mark recurring shift as inactive
    await prisma.recurringShift.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ 
      success: true,
      deletedShifts: shiftIds.length 
    })
  } catch (error) {
    console.error('Error deleting recurring shift:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

