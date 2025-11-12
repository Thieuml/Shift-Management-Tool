import { GET } from "@/app/api/schedule/route";
import { cleanupDatabase, seedTestData } from "@/lib/test-helpers";
import { prisma } from "@/lib/test-helpers";
import { createTestRequest } from "../helpers/test-server";

describe("GET /api/schedule", () => {
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

  it("should return schedule for valid country and date range", async () => {
    const { country, sector, template } = await seedTestData();
    const shiftDate = new Date();
    shiftDate.setUTCHours(0, 0, 0, 0);

    await prisma.shift.create({
      data: {
        date: shiftDate,
        countryCode: country.code,
        sectorId: sector.id,
        templateId: template.id,
      },
    });

    const from = shiftDate.toISOString().split("T")[0];
    const to = shiftDate.toISOString().split("T")[0];

    const url = `http://localhost:3000/api/schedule?country=${country.code}&from=${from}&to=${to}`;
    const request = createTestRequest(url, { method: "GET" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.meta.country).toBe(country.code);
  });

  it("should return 400 for missing country parameter", async () => {
    const url = "http://localhost:3000/api/schedule?from=2024-01-01&to=2024-01-31";
    const request = createTestRequest(url, { method: "GET" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should return 400 for invalid date format", async () => {
    const { country } = await seedTestData();
    const url = `http://localhost:3000/api/schedule?country=${country.code}&from=invalid&to=2024-01-31`;
    const request = createTestRequest(url, { method: "GET" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });

  it("should return empty array for date range with no shifts", async () => {
    const { country } = await seedTestData();
    const url = `http://localhost:3000/api/schedule?country=${country.code}&from=2025-01-01&to=2025-01-31`;
    const request = createTestRequest(url, { method: "GET" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
  });
});
