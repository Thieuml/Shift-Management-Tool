import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const performedSchema = z.object({
  performed: z.boolean(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const shiftId = params.id;

  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = performedSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { performed } = validation.data;

    // Check if shift exists
    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
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
        assignments: {
          include: {
            engineer: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!shift) {
      return NextResponse.json(
        { error: "Shift not found" },
        { status: 404 }
      );
    }

    // Update shift performed status
    const updatedShift = await prisma.shift.update({
      where: { id: shiftId },
      data: { performed },
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
        assignments: {
          include: {
            engineer: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedShift.id,
        date: updatedShift.date.toISOString(),
        sector: {
          id: updatedShift.sector.id,
          name: updatedShift.sector.name,
        },
        template: updatedShift.template,
        performed: updatedShift.performed,
        assignments: updatedShift.assignments.map((assignment) => ({
          id: assignment.id,
          engineer: {
            id: assignment.engineer.id,
            name: assignment.engineer.name,
            role: assignment.engineer.role,
          },
          createdAt: assignment.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error("Mark shift performed error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
