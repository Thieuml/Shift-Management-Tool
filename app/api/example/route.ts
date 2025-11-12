import { NextResponse } from "next/server";
import { z } from "zod";

const exampleSchema = z.object({
  message: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const message = searchParams.get("message");

    const validated = exampleSchema.parse({ message: message || undefined });

    return NextResponse.json({
      success: true,
      data: {
        message: validated.message || "Hello from API!",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
