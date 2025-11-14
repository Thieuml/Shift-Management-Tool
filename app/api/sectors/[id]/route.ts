import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { name, active } = body

    const sector = await prisma.sector.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(active !== undefined && { active }),
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

    return NextResponse.json({ sector })
  } catch (error) {
    console.error('Error updating sector:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.sector.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting sector:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


