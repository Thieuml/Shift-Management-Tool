import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scheduleQuerySchema } from '@/lib/zod'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = {
      country: searchParams.get('country'),
      from: searchParams.get('from'),
      to: searchParams.get('to'),
    }

    // Validate query parameters
    const validation = scheduleQuerySchema.safeParse(query)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { country, from, to } = validation.data

    // Parse dates (YYYY-MM-DD format)
    const fromDate = new Date(`${from}T00:00:00Z`)
    const toDate = new Date(`${to}T23:59:59Z`)

    // Fetch shifts with related data
    const shifts = await prisma.shift.findMany({
      where: {
        countryCode: country,
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
      include: {
        sector: {
          select: {
            id: true,
            name: true,
          },
        },
        recurringShift: {
          select: {
            id: true,
            name: true,
            start: true,
            end: true,
            type: true,
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
        country: {
          select: {
            code: true,
            name: true,
            timezone: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { plannedStart: 'asc' },
      ],
    })

    return NextResponse.json({ shifts })
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

