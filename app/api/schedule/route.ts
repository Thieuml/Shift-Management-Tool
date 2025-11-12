import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { scheduleQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get("country");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Validate query parameters
    const validation = scheduleQuerySchema.safeParse({ country, from, to });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { country: countryCode, from: fromDate, to: toDate } = validation.data;

    // Parse dates
    const fromDateTime = new Date(fromDate + "T00:00:00Z");
    const toDateTime = new Date(toDate + "T23:59:59Z");

    // Fetch shifts with related data
    const shifts = await prisma.shift.findMany({
      where: {
        countryCode,
        date: {
          gte: fromDateTime,
          lte: toDateTime,
        },
      },
      include: {
        sector: {
          select: {
            id: true,
            name: true,
            active: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            start: true,
            end: true,
            type: true,
            requiredCount: true,
          },
        },
        assignments: {
          include: {
            engineer: {
              select: {
                id: true,
                name: true,
                role: true,
                active: true,
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
        { date: "asc" },
        { sectorId: "asc" },
      ],
    });

    // Format response
    const schedule = shifts.map((shift) => ({
      id: shift.id,
      date: shift.date.toISOString().split("T")[0],
      country: {
        code: shift.country.code,
        name: shift.country.name,
        timezone: shift.country.timezone,
      },
      sector: {
        id: shift.sector.id,
        name: shift.sector.name,
        active: shift.sector.active,
      },
      template: shift.template
        ? {
            id: shift.template.id,
            name: shift.template.name,
            start: shift.template.start,
            end: shift.template.end,
            type: shift.template.type,
            requiredCount: shift.template.requiredCount,
          }
        : null,
      performed: shift.performed,
      assignments: shift.assignments.map((assignment) => ({
        id: assignment.id,
        engineer: {
          id: assignment.engineer.id,
          name: assignment.engineer.name,
          role: assignment.engineer.role,
          active: assignment.engineer.active,
        },
        createdAt: assignment.createdAt.toISOString(),
      })),
    }));

    return NextResponse.json({
      success: true,
      data: schedule,
      meta: {
        country: countryCode,
        from: fromDate,
        to: toDate,
        count: schedule.length,
      },
    });
  } catch (error) {
    console.error("Schedule API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
