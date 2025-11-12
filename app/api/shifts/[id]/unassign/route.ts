import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignShiftSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shiftId = params.id;

  try {
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

    // Check if assignment exists
    const assignment = await prisma.assignment.findUnique({
      where: {
        shiftId_engineerId: {
          shiftId,
          engineerId,
        },
      },
      include: {
        engineer: {
          select: {
            id: true,
            name: true,
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
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Delete assignment
    await prisma.assignment.delete({
      where: {
        id: assignment.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: "Engineer unassigned successfully",
        assignment: {
          id: assignment.id,
          engineer: {
            id: assignment.engineer.id,
            name: assignment.engineer.name,
          },
          shift: {
            id: assignment.shift.id,
            date: assignment.shift.date.toISOString(),
            sector: {
              id: assignment.shift.sector.id,
              name: assignment.shift.sector.name,
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Unassign shift error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
