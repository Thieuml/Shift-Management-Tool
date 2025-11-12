import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignShiftSchema } from "@/lib/validations";
import { acquireLock, releaseLock } from "@/lib/redis";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shiftId = params.id;
  let lockValue: string | null = null;

  try {
    // Acquire Redis lock
    lockValue = await acquireLock(`shift:${shiftId}`, 30);
    if (!lockValue) {
      return NextResponse.json(
        { error: "Could not acquire lock. Another operation may be in progress." },
        { status: 409 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = assignShiftSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { engineerId } = validation.data;

    // Check if shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        assignments: true,
        template: true,
      },
    });

    if (!shift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 }
      );
    }

    // Check if engineer exists and is active
    const engineer = await prisma.engineer.findUnique({
      where: { id: engineerId },
      include: {
        sectors: true,
      },
    });

    if (!engineer) {
      return NextResponse.json(
        { error: "Engineer not found" },
        { status: 404 }
      );
    }

    if (!engineer.active) {
      return NextResponse.json(
        { error: "Engineer is not active" },
        { status: 400 }
      );
    }

    // Check if engineer is in the shift's sector
    const engineerInSector = engineer.sectors.some(
      (sector) => sector.id === shift.sectorId
    );

    if (!engineerInSector) {
      return NextResponse.json(
        { error: "Engineer is not assigned to this shift's sector" },
        { status: 400 }
      );
    }

    // Check if engineer is already assigned to this shift
    const existingAssignment = await prisma.assignment.findUnique({
      where: {
        shiftId_engineerId: {
          shiftId,
          engineerId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Engineer is already assigned to this shift" },
        { status: 409 }
      );
    }

    // Check if shift has reached required count (if template exists)
    if (shift.template) {
      const currentAssignments = shift.assignments.length;
      if (currentAssignments >= shift.template.requiredCount) {
        return NextResponse.json(
          { error: "Shift has reached maximum required assignments" },
          { status: 400 }
        );
      }
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        shiftId,
        engineerId,
      },
      include: {
        engineer: {
          select: {
            id: true,
            name: true,
            role: true,
            active: true,
          },
        },
        shift: {
          include: {
            sector: {
              select: {
                id: true,
                name: true,
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: assignment.id,
        engineer: {
          id: assignment.engineer.id,
          name: assignment.engineer.name,
          role: assignment.engineer.role,
          active: assignment.engineer.active,
        },
        shift: {
          id: assignment.shift.id,
          date: assignment.shift.date.toISOString(),
          sector: {
            id: assignment.shift.sector.id,
            name: assignment.shift.sector.name,
          },
          template: assignment.shift.template,
          performed: assignment.shift.performed,
        },
        createdAt: assignment.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("Assign shift error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  } finally {
    // Release lock
    if (lockValue) {
      await releaseLock(`shift:${shiftId}`, lockValue);
    }
  }
}
