import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shiftId = params.id

  try {
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

    // Parse request body to get engineerId (optional - if not provided, unassign all)
    const body = await request.json().catch(() => ({}))
    const { engineerId } = body

    if (engineerId) {
      // Unassign specific engineer
      const assignment = shift.assignments.find(
        (a) => a.engineerId === engineerId
      )

      if (!assignment) {
        return NextResponse.json(
          { error: 'Engineer is not assigned to this shift' },
          { status: 404 }
        )
      }

      await prisma.$transaction([
        prisma.assignment.delete({
          where: { id: assignment.id },
        }),
        prisma.shift.update({
          where: { id: shiftId },
          data: {
            status: shift.assignments.length === 1 ? 'UNASSIGNED' : 'ASSIGNED',
            updatedBy: 'system', // TODO: Get from auth session
          },
        }),
      ])

      return NextResponse.json({ message: 'Engineer unassigned successfully' })
    } else {
      // Unassign all engineers
      await prisma.$transaction([
        prisma.assignment.deleteMany({
          where: { shiftId },
        }),
        prisma.shift.update({
          where: { id: shiftId },
          data: {
            status: 'UNASSIGNED',
            updatedBy: 'system', // TODO: Get from auth session
          },
        }),
      ])

      return NextResponse.json({ message: 'All engineers unassigned successfully' })
    }
  } catch (error) {
    console.error('Error unassigning shift:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

