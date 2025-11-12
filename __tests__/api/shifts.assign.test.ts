import { POST } from "@/app/api/shifts/[id]/assign/route";
import { cleanupDatabase, seedTestData } from "@/lib/test-helpers";
import { prisma } from "@/lib/test-helpers";
import { createTestRequest } from "../helpers/test-server";

describe("POST /api/shifts/:id/assign", () => {
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

  it("should assign engineer to shift", async () => {
    const { shift, engineer1 } = await seedTestData();

    const requestBody = {
      engineerId: engineer1.id,
    };

    const request = createTestRequest(`http://localhost:3000/api/shifts/${shift.id}/assign`, {
      method: "POST",
      body: requestBody,
    });

    const response = await POST(request, { params: { id: shift.id } });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.engineer.id).toBe(engineer1.id);
    expect(data.data.shift.id).toBe(shift.id);

    // Verify assignment was created in database
    const assignment = await prisma.assignment.findUnique({
      where: {
        shiftId_engineerId: {
          shiftId: shift.id,
          engineerId: engineer1.id,
        },
      },
    });

    expect(assignment).not.toBeNull();
  });

  it("should return 404 for non-existent shift", async () => {
    const { engineer1 } = await seedTestData();

    const request = createTestRequest("http://localhost:3000/api/shifts/non-existent/assign", {
      method: "POST",
      body: { engineerId: engineer1.id },
    });

    const response = await POST(request, { params: { id: "non-existent" } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Shift not found");
  });

  it("should return 404 for non-existent engineer", async () => {
    const { shift } = await seedTestData();

    const request = createTestRequest(`http://localhost:3000/api/shifts/${shift.id}/assign`, {
      method: "POST",
      body: { engineerId: "non-existent" },
    });

    const response = await POST(request, { params: { id: shift.id } });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Engineer not found");
  });

  it("should return 409 if engineer is already assigned", async () => {
    const { shift, engineer1 } = await seedTestData();

    // Create initial assignment
    await prisma.assignment.create({
      data: {
        shiftId: shift.id,
        engineerId: engineer1.id,
      },
    });

    const request = createTestRequest(`http://localhost:3000/api/shifts/${shift.id}/assign`, {
      method: "POST",
      body: { engineerId: engineer1.id },
    });

    const response = await POST(request, { params: { id: shift.id } });
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.error).toBe("Engineer is already assigned to this shift");
  });

  it("should return 400 if engineer is not in shift sector", async () => {
    const { shift, country } = await seedTestData();

    // Create engineer in different sector
    const otherSector = await prisma.sector.create({
      data: {
        name: "Other Sector",
        active: true,
        countryCode: country.code,
      },
    });

    const otherEngineer = await prisma.engineer.create({
      data: {
        name: "Other Engineer",
        active: true,
        role: "ENGINEER",
        countryCode: country.code,
        sectors: {
          connect: { id: otherSector.id },
        },
      },
    });

    const request = createTestRequest(`http://localhost:3000/api/shifts/${shift.id}/assign`, {
      method: "POST",
      body: { engineerId: otherEngineer.id },
    });

    const response = await POST(request, { params: { id: shift.id } });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Engineer is not assigned to this shift's sector");
  });
});
