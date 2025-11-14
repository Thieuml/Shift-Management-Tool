import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { engineersQuerySchema } from '@/lib/zod'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = {
      country: searchParams.get('country'),
      sector: searchParams.get('sector'),
      start: searchParams.get('start'),
      end: searchParams.get('end'),
    }

    // Validate query parameters
    const validation = engineersQuerySchema.safeParse(query)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { country, sector, start, end } = validation.data

    const startDate = new Date(start)
    const endDate = new Date(end)

    // Build where clause
    const where: any = {
      countryCode: country,
      active: true,
      role: 'ENGINEER',
    }

    if (sector) {
      where.sectors = {
        some: {
          id: sector,
        },
      }
    }

    // Fetch engineers
    const engineers = await prisma.engineer.findMany({
      where,
      include: {
        sectors: {
          select: {
            id: true,
            name: true,
          },
        },
        assignments: {
          where: {
            shift: {
              plannedStart: {
                lt: endDate,
              },
              plannedEnd: {
                gt: startDate,
              },
            },
          },
          include: {
            shift: {
              select: {
                id: true,
                date: true,
                plannedStart: true,
                plannedEnd: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json({ engineers })
  } catch (error) {
    console.error('Error fetching engineers:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

