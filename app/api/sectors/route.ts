import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const country = searchParams.get('country')

    const where: any = {}
    if (country) {
      where.countryCode = country
    }

    const sectors = await prisma.sector.findMany({
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

    return NextResponse.json({ sectors })
  } catch (error) {
    console.error('Error fetching sectors:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, countryCode, active = true } = body

    if (!name || !countryCode) {
      return NextResponse.json(
        { error: 'Name and countryCode are required' },
        { status: 400 }
      )
    }

    const sector = await prisma.sector.create({
      data: {
        name,
        countryCode,
        active,
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

    return NextResponse.json({ sector }, { status: 201 })
  } catch (error) {
    console.error('Error creating sector:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


