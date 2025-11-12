import { POST } from "@/app/api/shifts/[id]/reassign/route";
import { cleanupDatabase, seedTestData } from "@/lib/test-helpers";
import { prisma } from "@/lib/test-helpers";
import { createTestRequest } from "../helpers/test-server";

describe("POST /api/shifts/:id/reassign", () => {
  beforeAll(async () => {
    await cleanupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await cleanupDatabase();
  });

  it("should reassign shift from one engineer to another", async () => {
    const { shift, engineer1, engineer2 } = await seedTestData();

    // Create initial assignment
    await prisma.assignment.create({
      data: {
        shiftId: shift.id,
        engineerId: engineer1.id,
      },
    });

    const requestBody = {
      engineerId: engineer2.id,
      fromEngineerId: engineer1.id,
    };

    const request = createTestRequest(`http://localhost:3000/api/shifts/${shift.id}/reassign`, {
      method: "POST",
      body: requestBody,
    });

    const response = await POST(request, { params: { id: shift.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.engineer.id).toBe(engineer2.id);
    expect(data.data.reassignedFrom).toBe(engineer1.id);

    // Verify old assignment is removed and new one exists
    const oldAssignment = await prisma.assignment.findUnique({
      where: {
        shiftId_engineerId: {
          shiftId: shift.id,
          engineerId: engineer1.id,
        },
      },
    });

    const newAssignment = await prisma.assignment.findUnique({
      where: {
        shiftId_engineerId: {
          shiftId: shift.id,
          engineerId: engineer2.id,
        },
      },
    });

    expect(oldAssignment).toBeNull();
    expect(newAssignment).not.toBeNull();
  });

  it("should return 404 if source engineer is not assigned", async () => {
    const { shift, engineer1, engineer2 } = await seedTestData();

    const request = createTestRequest(`http://localhost:3000/api/shifts/${shift.id}/reassign`, {
      method: "POST",
      body: {
        engineerId: engineer2.id,
        fromEngineerId: engineer1.id,
      },
    });

    const response = await POST(request, { params: { id: shift.id } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Source engineer is not assigned to this shift");
  });

  it("should return 400 for invalid request body", async () => {
    const { shift } = await seedTestData();

    const request = createTestRequest(`http://localhost:3000/api/shifts/${shift.id}/reassign`, {
      method: "POST",
      body: {},
    });

    const response = await POST(request, { params: { id: shift.id } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
