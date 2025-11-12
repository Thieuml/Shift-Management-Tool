import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reassignShiftSchema } from "@/lib/validations";
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
    const validation = reassignShiftSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { engineerId, fromEngineerId } = validation.data;

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

    // Check if fromEngineer assignment exists
    const fromAssignment = await prisma.assignment.findUnique({
      where: {
        shiftId_engineerId: {
          shiftId,
          engineerId: fromEngineerId,
        },
      },
    });

    if (!fromAssignment) {
      return NextResponse.json(
        { error: "Source engineer is not assigned to this shift" },
        { status: 404 }
      );
    }

    // Check if toEngineer exists and is active
    const toEngineer = await prisma.engineer.findUnique({
      where: { id: engineerId },
      include: {
        sectors: true,
      },
    });

    if (!toEngineer) {
      return NextResponse.json(
        { error: "Target engineer not found" },
        { status: 404 }
      );
    }

    if (!toEngineer.active) {
      return NextResponse.json(
        { error: "Target engineer is not active" },
        { status: 400 }
      );
    }

    // Check if toEngineer is in the shift's sector
    const engineerInSector = toEngineer.sectors.some(
      (sector) => sector.id === shift.sectorId
    );

    if (!engineerInSector) {
      return NextResponse.json(
        { error: "Target engineer is not assigned to this shift's sector" },
        { status: 400 }
      );
    }

    // Check if toEngineer is already assigned (and it's not the same engineer)
    if (fromEngineerId !== engineerId) {
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
          { error: "Target engineer is already assigned to this shift" },
          { status: 409 }
        );
      }
    }

    // Perform reassignment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Delete old assignment
      await tx.assignment.delete({
        where: {
          id: fromAssignment.id,
        },
      });

      // Create new assignment
      const newAssignment = await tx.assignment.create({
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

      return newAssignment;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        engineer: {
          id: result.engineer.id,
          name: result.engineer.name,
          role: result.engineer.role,
          active: result.engineer.active,
        },
        shift: {
          id: result.shift.id,
          date: result.shift.date.toISOString(),
          sector: {
            id: result.shift.sector.id,
            name: result.shift.sector.name,
          },
          template: result.shift.template,
          performed: result.shift.performed,
        },
        createdAt: result.createdAt.toISOString(),
        reassignedFrom: fromEngineerId,
      },
    });
  } catch (error) {
    console.error("Reassign shift error:", error);
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
