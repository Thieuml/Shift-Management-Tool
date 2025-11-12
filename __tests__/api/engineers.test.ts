import { GET } from "@/app/api/engineers/route";
import { cleanupDatabase, seedTestData } from "@/lib/test-helpers";
import { prisma } from "@/lib/test-helpers";
import { createTestRequest } from "../helpers/test-server";

describe("GET /api/engineers", () => {
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

  it("should return engineers for valid country and date range", async () => {
    const { country, engineer1, engineer2 } = await seedTestData();

    const start = new Date().toISOString();
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const url = `http://localhost:3000/api/engineers?country=${country.code}&start=${start}&end=${end}`;
    const request = createTestRequest(url, { method: "GET" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(2);
    expect(data.data.some((e: any) => e.id === engineer1.id)).toBe(true);
    expect(data.data.some((e: any) => e.id === engineer2.id)).toBe(true);
  });

  it("should filter engineers by sector", async () => {
    const { country, sector, engineer1 } = await seedTestData();

    const start = new Date().toISOString();
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const url = `http://localhost:3000/api/engineers?country=${country.code}&sector=${sector.id}&start=${start}&end=${end}`;
    const request = createTestRequest(url, { method: "GET" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.every((e: any) => e.sectors.some((s: any) => s.id === sector.id))).toBe(true);
  });

  it("should return 400 for missing required parameters", async () => {
    const url = "http://localhost:3000/api/engineers?country=TEST";
    const request = createTestRequest(url, { method: "GET" });
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeDefined();
  });
});
