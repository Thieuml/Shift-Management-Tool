import { PrismaClient, Role, ShiftType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Check if we should clear existing data (only in development)
  const shouldClear = process.env.NODE_ENV !== "production" || process.env.CLEAR_DB === "true";
  
  if (shouldClear) {
    // Clear existing data (in reverse order of dependencies)
    console.log("🧹 Cleaning existing data...");
    await prisma.assignment.deleteMany();
    await prisma.shift.deleteMany();
    await prisma.shiftTemplate.deleteMany();
    await prisma.holiday.deleteMany();
    await prisma.engineer.deleteMany();
    await prisma.sector.deleteMany();
    await prisma.country.deleteMany();
  } else {
    // In production, check if data already exists
    const existingCountries = await prisma.country.count();
    if (existingCountries > 0) {
      console.log("⚠️  Database already contains data. Skipping seed.");
      console.log("   To force reseed, set CLEAR_DB=true environment variable.");
      return;
    }
  }

  // Create Countries
  console.log("🌍 Creating countries...");
  const usa = await prisma.country.create({
    data: {
      code: "US",
      name: "United States",
      timezone: "America/New_York",
    },
  });

  const uk = await prisma.country.create({
    data: {
      code: "UK",
      name: "United Kingdom",
      timezone: "Europe/London",
    },
  });

  const france = await prisma.country.create({
    data: {
      code: "FR",
      name: "France",
      timezone: "Europe/Paris",
    },
  });

  const germany = await prisma.country.create({
    data: {
      code: "DE",
      name: "Germany",
      timezone: "Europe/Berlin",
    },
  });

  // Create Holidays
  console.log("🎉 Creating holidays...");
  const holidays2024 = [
    // US Holidays
    { countryCode: "US", date: new Date("2024-01-01T00:00:00Z"), label: "New Year's Day" },
    { countryCode: "US", date: new Date("2024-07-04T00:00:00Z"), label: "Independence Day" },
    { countryCode: "US", date: new Date("2024-12-25T00:00:00Z"), label: "Christmas Day" },
    // UK Holidays
    { countryCode: "UK", date: new Date("2024-01-01T00:00:00Z"), label: "New Year's Day" },
    { countryCode: "UK", date: new Date("2024-12-25T00:00:00Z"), label: "Christmas Day" },
    { countryCode: "UK", date: new Date("2024-12-26T00:00:00Z"), label: "Boxing Day" },
    // France Holidays
    { countryCode: "FR", date: new Date("2024-01-01T00:00:00Z"), label: "Jour de l'An" },
    { countryCode: "FR", date: new Date("2024-07-14T00:00:00Z"), label: "Bastille Day" },
    { countryCode: "FR", date: new Date("2024-12-25T00:00:00Z"), label: "Noël" },
    // Germany Holidays
    { countryCode: "DE", date: new Date("2024-01-01T00:00:00Z"), label: "Neujahr" },
    { countryCode: "DE", date: new Date("2024-10-03T00:00:00Z"), label: "Tag der Deutschen Einheit" },
    { countryCode: "DE", date: new Date("2024-12-25T00:00:00Z"), label: "Weihnachten" },
  ];

  await prisma.holiday.createMany({
    data: holidays2024,
  });

  // Create Sectors
  console.log("🏢 Creating sectors...");
  const sectors = [
    { name: "Healthcare", countryCode: "US", active: true },
    { name: "Finance", countryCode: "US", active: true },
    { name: "Retail", countryCode: "US", active: true },
    { name: "Healthcare", countryCode: "UK", active: true },
    { name: "Finance", countryCode: "UK", active: true },
    { name: "Healthcare", countryCode: "FR", active: true },
    { name: "Finance", countryCode: "FR", active: true },
    { name: "Healthcare", countryCode: "DE", active: true },
    { name: "Manufacturing", countryCode: "DE", active: true },
  ];

  const createdSectors = await Promise.all(
    sectors.map((sector) =>
      prisma.sector.create({
        data: sector,
      })
    )
  );

  // Create Engineers
  console.log("👷 Creating engineers...");
  const engineers = [
    // US Engineers
    {
      name: "John Smith",
      countryCode: "US",
      role: Role.ADMIN,
      active: true,
      sectorIds: [createdSectors[0].id, createdSectors[1].id], // Healthcare, Finance
    },
    {
      name: "Sarah Johnson",
      countryCode: "US",
      role: Role.OPS,
      active: true,
      sectorIds: [createdSectors[0].id], // Healthcare
    },
    {
      name: "Mike Davis",
      countryCode: "US",
      role: Role.ENGINEER,
      active: true,
      sectorIds: [createdSectors[1].id], // Finance
    },
    {
      name: "Emily Chen",
      countryCode: "US",
      role: Role.ENGINEER,
      active: true,
      sectorIds: [createdSectors[2].id], // Retail
    },
    // UK Engineers
    {
      name: "James Wilson",
      countryCode: "UK",
      role: Role.ADMIN,
      active: true,
      sectorIds: [createdSectors[3].id], // Healthcare
    },
    {
      name: "Emma Brown",
      countryCode: "UK",
      role: Role.ENGINEER,
      active: true,
      sectorIds: [createdSectors[3].id, createdSectors[4].id], // Healthcare, Finance
    },
    {
      name: "Oliver Taylor",
      countryCode: "UK",
      role: Role.ENGINEER,
      active: true,
      sectorIds: [createdSectors[4].id], // Finance
    },
    // France Engineers
    {
      name: "Pierre Dubois",
      countryCode: "FR",
      role: Role.OPS,
      active: true,
      sectorIds: [createdSectors[5].id], // Healthcare
    },
    {
      name: "Marie Martin",
      countryCode: "FR",
      role: Role.ENGINEER,
      active: true,
      sectorIds: [createdSectors[5].id, createdSectors[6].id], // Healthcare, Finance
    },
    {
      name: "Jean Bernard",
      countryCode: "FR",
      role: Role.ENGINEER,
      active: true,
      sectorIds: [createdSectors[6].id], // Finance
    },
    // Germany Engineers
    {
      name: "Hans Mueller",
      countryCode: "DE",
      role: Role.ADMIN,
      active: true,
      sectorIds: [createdSectors[7].id], // Healthcare
    },
    {
      name: "Anna Schmidt",
      countryCode: "DE",
      role: Role.ENGINEER,
      active: true,
      sectorIds: [createdSectors[7].id, createdSectors[8].id], // Healthcare, Manufacturing
    },
    {
      name: "Thomas Weber",
      countryCode: "DE",
      role: Role.ENGINEER,
      active: true,
      sectorIds: [createdSectors[8].id], // Manufacturing
    },
  ];

  const createdEngineers = await Promise.all(
    engineers.map((engineer) =>
      prisma.engineer.create({
        data: {
          name: engineer.name,
          countryCode: engineer.countryCode,
          role: engineer.role,
          active: engineer.active,
          sectors: {
            connect: engineer.sectorIds.map((id) => ({ id })),
          },
        },
      })
    )
  );

  // Create Shift Templates
  console.log("📅 Creating shift templates...");
  const templates = [
    {
      name: "Weekday Onsite",
      start: "08:00",
      end: "17:00",
      type: ShiftType.ONSITE,
      dow: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      requiredCount: 2,
      countryCode: "US",
    },
    {
      name: "Weekend Onsite",
      start: "09:00",
      end: "18:00",
      type: ShiftType.ONSITE,
      dow: ["Sat", "Sun"],
      requiredCount: 1,
      countryCode: "US",
    },
    {
      name: "Remote Weekday",
      start: "09:00",
      end: "18:00",
      type: ShiftType.REMOTE,
      dow: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      requiredCount: 1,
      countryCode: "US",
    },
    {
      name: "UK Standard",
      start: "09:00",
      end: "17:30",
      type: ShiftType.ONSITE,
      dow: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      requiredCount: 1,
      countryCode: "UK",
    },
    {
      name: "UK Weekend",
      start: "10:00",
      end: "18:00",
      type: ShiftType.ONSITE,
      dow: ["Sat", "Sun"],
      requiredCount: 1,
      countryCode: "UK",
    },
    {
      name: "France Standard",
      start: "08:30",
      end: "17:30",
      type: ShiftType.ONSITE,
      dow: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      requiredCount: 1,
      countryCode: "FR",
    },
    {
      name: "Germany Standard",
      start: "08:00",
      end: "17:00",
      type: ShiftType.ONSITE,
      dow: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      requiredCount: 1,
      countryCode: "DE",
    },
  ];

  const createdTemplates = await Promise.all(
    templates.map((template) =>
      prisma.shiftTemplate.create({
        data: template,
      })
    )
  );

  // Create Shifts for the next 30 days
  console.log("📆 Creating shifts...");
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const shifts: Array<{
    date: Date;
    countryCode: string;
    sectorId: string;
    templateId: string | null;
  }> = [];

  // Helper to get day of week abbreviation
  const getDayOfWeek = (date: Date): string => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getUTCDay()];
  };

  // Fetch all holidays once
  const allHolidays = await prisma.holiday.findMany();
  const holidayMap = new Map<string, Set<string>>(); // countryCode -> Set of date strings
  for (const holiday of allHolidays) {
    const dateStr = holiday.date.toISOString().split("T")[0];
    if (!holidayMap.has(holiday.countryCode)) {
      holidayMap.set(holiday.countryCode, new Set());
    }
    holidayMap.get(holiday.countryCode)!.add(dateStr);
  }

  // Helper to check if date is a holiday
  const isHoliday = (date: Date, countryCode: string): boolean => {
    const dateStr = date.toISOString().split("T")[0];
    return holidayMap.get(countryCode)?.has(dateStr) || false;
  };

  for (let i = 0; i < 30; i++) {
    const shiftDate = new Date(today);
    shiftDate.setUTCDate(today.getUTCDate() + i);
    const dow = getDayOfWeek(shiftDate);
    const dateStr = shiftDate.toISOString().split("T")[0];

    // Create shifts for each country and sector
    for (const sector of createdSectors) {
      // Find matching template for this country and day
      const matchingTemplate = createdTemplates.find((t) => {
        if (t.countryCode !== sector.countryCode) return false;
        // Check if it's a holiday (PH) or matches the day of week
        return t.dow.includes("PH") && isHoliday(shiftDate, sector.countryCode)
          ? true
          : t.dow.includes(dow);
      });

      shifts.push({
        date: shiftDate,
        countryCode: sector.countryCode,
        sectorId: sector.id,
        templateId: matchingTemplate?.id || null,
      });
    }
  }

  const createdShifts = await Promise.all(
    shifts.map((shift) =>
      prisma.shift.create({
        data: shift,
      })
    )
  );

  // Create Assignments for some shifts
  console.log("👤 Creating assignments...");
  const assignments: Array<{ engineerId: string; shiftId: string }> = [];

  // Create a map of engineer IDs to their sector IDs
  const engineerSectorMap = new Map<string, string[]>();
  for (let i = 0; i < engineers.length; i++) {
    engineerSectorMap.set(createdEngineers[i].id, engineers[i].sectorIds);
  }

  // Assign engineers to shifts based on their sectors
  for (const shift of createdShifts.slice(0, 50)) {
    // Find engineers in this shift's sector and country
    const availableEngineers = createdEngineers.filter((eng) => {
      if (eng.countryCode !== shift.countryCode || !eng.active) {
        return false;
      }
      const engSectorIds = engineerSectorMap.get(eng.id) || [];
      return engSectorIds.includes(shift.sectorId);
    });

    if (availableEngineers.length > 0) {
      // Randomly assign 1-2 engineers per shift
      const count = Math.min(Math.floor(Math.random() * 2) + 1, availableEngineers.length);
      const selected = availableEngineers
        .sort(() => Math.random() - 0.5)
        .slice(0, count);

      for (const engineer of selected) {
        assignments.push({
          engineerId: engineer.id,
          shiftId: shift.id,
        });
      }
    }
  }

  await Promise.all(
    assignments.map((assignment) =>
      prisma.assignment.create({
        data: assignment,
      })
    )
  );

  console.log("✅ Seed completed successfully!");
  console.log(`   - ${await prisma.country.count()} countries`);
  console.log(`   - ${await prisma.holiday.count()} holidays`);
  console.log(`   - ${await prisma.sector.count()} sectors`);
  console.log(`   - ${await prisma.engineer.count()} engineers`);
  console.log(`   - ${await prisma.shiftTemplate.count()} shift templates`);
  console.log(`   - ${await prisma.shift.count()} shifts`);
  console.log(`   - ${await prisma.assignment.count()} assignments`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
