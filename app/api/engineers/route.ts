import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { engineersQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const sector = searchParams.get("sector");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    // Validate query parameters
    const validation = engineersQuerySchema.safeParse({
      country,
      sector: sector || undefined,
      start,
      end,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { country: countryCode, sector: sectorId, start: startDate, end: endDate } = validation.data;

    // Parse dates
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    // Build where clause
    const where: any = {
      countryCode,
      active: true,
    };

    // If sector is provided, filter by sector
    if (sectorId) {
      where.sectors = {
        some: {
          id: sectorId,
        },
      };
    }

    // Fetch engineers
    const engineers = await prisma.engineer.findMany({
      where,
      include: {
        sectors: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
        assignments: {
          where: {
            shift: {
              date: {
                gte: startDateTime,
                lte: endDateTime,
              },
            },
          },
          include: {
            shift: {
              select: {
                id: true,
                date: true,
                sectorId: true,
                performed: true,
                sector: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
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
      orderBy: {
        name: "asc",
      },
    });

    // Format response
    const formattedEngineers = engineers.map((engineer) => ({
      id: engineer.id,
      name: engineer.name,
      role: engineer.role,
      active: engineer.active,
      country: {
        code: engineer.country.code,
        name: engineer.country.name,
        timezone: engineer.country.timezone,
      },
      sectors: engineer.sectors.map((sector) => ({
        id: sector.id,
        name: sector.name,
        active: sector.active,
      })),
      assignments: engineer.assignments.map((assignment) => ({
        id: assignment.id,
        shift: {
          id: assignment.shift.id,
          date: assignment.shift.date.toISOString(),
          sector: {
            id: assignment.shift.sector.id,
            name: assignment.shift.sector.name,
          },
          performed: assignment.shift.performed,
        },
        createdAt: assignment.createdAt.toISOString(),
      })),
      createdAt: engineer.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: formattedEngineers,
      meta: {
        country: countryCode,
        sector: sectorId || null,
        start: startDate,
        end: endDate,
        count: formattedEngineers.length,
      },
    });
  } catch (error) {
    console.error("Engineers API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
