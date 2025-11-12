import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export async function cleanupDatabase() {
  // Delete in reverse order of dependencies
  await prisma.assignment.deleteMany();
  await prisma.shift.deleteMany();
  await prisma.shiftTemplate.deleteMany();
  await prisma.holiday.deleteMany();
  await prisma.engineer.deleteMany();
  await prisma.sector.deleteMany();
  await prisma.country.deleteMany();
}

export async function seedTestData() {
  // Create test country
  const country = await prisma.country.create({
    data: {
      code: "TEST",
      name: "Test Country",
      timezone: "UTC",
    },
  });

  // Create test sector
  const sector = await prisma.sector.create({
    data: {
      name: "Test Sector",
      active: true,
      countryCode: country.code,
    },
  });

  // Create test engineers
  const engineer1 = await prisma.engineer.create({
    data: {
      name: "Test Engineer 1",
      active: true,
      role: "ENGINEER",
      countryCode: country.code,
      sectors: {
        connect: { id: sector.id },
      },
    },
  });

  const engineer2 = await prisma.engineer.create({
    data: {
      name: "Test Engineer 2",
      active: true,
      role: "ENGINEER",
      countryCode: country.code,
      sectors: {
        connect: { id: sector.id },
      },
    },
  });

  // Create test shift template
  const template = await prisma.shiftTemplate.create({
    data: {
      name: "Test Template",
      start: "09:00",
      end: "17:00",
      type: "ONSITE",
      dow: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      requiredCount: 1,
      countryCode: country.code,
    },
  });

  // Create test shift
  const shiftDate = new Date();
  shiftDate.setUTCHours(0, 0, 0, 0);
  const shift = await prisma.shift.create({
    data: {
      date: shiftDate,
      countryCode: country.code,
      sectorId: sector.id,
      templateId: template.id,
      performed: false,
    },
  });

  return {
    country,
    sector,
    engineer1,
    engineer2,
    template,
    shift,
  };
}
